import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

import { OrderStatus, isDelayStatus } from '@/lib/domain/enums';

const REVENUE_STATUSES = new Set([
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
]);

function isRevenueStatus(status: string) {
  return REVENUE_STATUSES.has(status as OrderStatus) || isDelayStatus(status);
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0];

    // 주문 데이터
    const [ordersRes, ebookRes, expensesRes, costsRes, returnReqsRes] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('id, total_amount, shipping_fee, status, created_at, cancel_refund_amount, order_items(product_id, quantity, price)')
        .gte('created_at', `${from}T00:00:00`)
        .lte('created_at', `${to}T23:59:59`),
      supabaseAdmin
        .from('ebook_orders')
        .select('amount, status')
        .neq('status', 'pending_payment')
        .gte('created_at', `${from}T00:00:00`)
        .lte('created_at', `${to}T23:59:59`),
      supabaseAdmin
        .from('expenses')
        .select('*')
        .gte('date', from)
        .lte('date', to),
      supabaseAdmin
        .from('product_costs')
        .select('product_id, color, cost_price, effective_date')
        .lte('effective_date', to)
        .order('effective_date', { ascending: false }),
      supabaseAdmin
        .from('return_requests')
        .select('refund_amount, return_shipping_fee, type, status')
        .gte('created_at', `${from}T00:00:00`)
        .lte('created_at', `${to}T23:59:59`),
    ]);

    if (ordersRes.error) return apiError(`주문 조회 실패: ${ordersRes.error.message}`, 500);
    if (ebookRes.error) return apiError(`전자책 조회 실패: ${ebookRes.error.message}`, 500);
    if (expensesRes.error) return apiError(`지출 조회 실패: ${expensesRes.error.message}`, 500);
    if (costsRes.error) return apiError(`원가 조회 실패: ${costsRes.error.message}`, 500);
    if (returnReqsRes.error) return apiError(`반품 조회 실패: ${returnReqsRes.error.message}`, 500);

    const orders = ordersRes.data ?? [];
    const ebookOrders = ebookRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const costs = costsRes.data ?? [];
    const returnReqs = returnReqsRes.data ?? [];

    // 상품별 최신 원가 맵 (product_id -> cost_price)
    const costMap = new Map<number, number>();
    for (const c of costs) {
      if (!costMap.has(c.product_id)) {
        costMap.set(c.product_id, c.cost_price);
      }
    }

    // 매출 계산
    const revenueOrders = orders.filter((o) => isRevenueStatus(o.status));
    const cancelledOrders = orders.filter((o) =>
      o.status === '취소요청' || o.status === '취소완료'
    );

    const grossRevenue = revenueOrders.reduce((s, o) => s + o.total_amount, 0);
    const cancelRefunds = cancelledOrders.reduce((s, o) => s + (o.cancel_refund_amount ?? 0), 0);

    // 반품(처리완료)만 환불액 차감 — refund_amount는 이미 return_shipping_fee가 공제된 순 환불액
    const completedReturns = returnReqs.filter(r => r.status === '처리완료' && r.type === '반품');
    const returnRefunds = completedReturns.reduce((s, r) => s + (r.refund_amount ?? 0), 0);

    // 교환 배송비 수입 — 교환 시 고객에게 수취한 왕복 배송비 (별도 수입, refund 없음)
    const exchanges = returnReqs.filter(r => r.type === '교환');
    const exchangeShippingIncome = exchanges.reduce((s, r) => s + (r.return_shipping_fee ?? 0), 0);

    const netRevenue = grossRevenue - cancelRefunds - returnRefunds + exchangeShippingIncome;
    const ebookRevenue = ebookOrders.reduce((s, o) => s + o.amount, 0);
    const totalNetRevenue = netRevenue + ebookRevenue;

    // COGS 계산 (원가 등록된 상품만)
    let cogs = 0;
    for (const order of revenueOrders) {
      const items = (order.order_items as { product_id: number | null; quantity: number }[]) ?? [];
      for (const item of items) {
        if (item.product_id && costMap.has(item.product_id)) {
          cogs += costMap.get(item.product_id)! * item.quantity;
        }
      }
    }

    // 매출총이익
    const grossProfit = totalNetRevenue - cogs;

    // 지출 카테고리별 집계
    const expensesByCategory: Record<string, number> = {};
    let totalExpenses = 0;
    let vatDeductibleTotal = 0;

    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount;
      totalExpenses += e.amount;
      if (e.vat_deductible) vatDeductibleTotal += e.amount;
    }

    // 영업이익
    const operatingIncome = grossProfit - totalExpenses;

    // 배송비 집계
    const shippingCollected = revenueOrders.reduce((s, o) => s + (o.shipping_fee ?? 0), 0);
    const productRevenue = grossRevenue - shippingCollected;
    const paidShippingCount = revenueOrders.filter(o => (o.shipping_fee ?? 0) > 0).length;
    const freeShippingCount = revenueOrders.filter(o => (o.shipping_fee ?? 0) === 0).length;
    // 도서산간: 기본 배송비(3000)보다 높은 경우
    const remoteAreaCount = revenueOrders.filter(o => (o.shipping_fee ?? 0) > 3000).length;
    // 반품 배송비: refund_amount에서 이미 공제됨 → 정보성 표시용
    const returnShippingCollected = completedReturns.reduce((s, r) => s + (r.return_shipping_fee ?? 0), 0);
    // 교환 배송비는 exchangeShippingIncome으로 이미 계산됨
    // 실제 발송/반품 배송비 지출 (expenses 테이블 기준)
    const shippingExpenseOut = (expensesByCategory['배송비(발송)'] ?? 0) + (expensesByCategory['배송비(반품)'] ?? 0);
    const shippingNetIncome = shippingCollected + returnShippingCollected + exchangeShippingIncome - shippingExpenseOut;

    // 부가세 계산 (판매가에 VAT 포함된 과세사업자 기준)
    // 공급가액 = 판매금액 / 1.1, 매출세액 = 공급가액 × 0.1
    const salesTaxBase = Math.round(totalNetRevenue / 1.1);
    const outputVat = Math.round(salesTaxBase * 0.1);
    // 매입세액 = vat_deductible 지출 / 1.1 × 0.1
    const inputVat = Math.round((vatDeductibleTotal / 1.1) * 0.1);
    const vatPayable = Math.max(0, outputVat - inputVat);

    return NextResponse.json({
      period: { from, to },
      revenue: {
        gross: grossRevenue,
        product_revenue: productRevenue,
        cancel_refunds: cancelRefunds,
        return_refunds: returnRefunds,
        exchange_shipping_income: exchangeShippingIncome,
        net: netRevenue,
        ebook: ebookRevenue,
        total_net: totalNetRevenue,
        order_count: revenueOrders.length,
        return_count: completedReturns.length,
        exchange_count: exchanges.length,
      },
      cogs,
      gross_profit: grossProfit,
      gross_margin_pct: totalNetRevenue > 0 ? Math.round((grossProfit / totalNetRevenue) * 100) : 0,
      expenses_by_category: expensesByCategory,
      total_expenses: totalExpenses,
      operating_income: operatingIncome,
      shipping: {
        collected: shippingCollected,
        return_collected: returnShippingCollected,   // 반품 수취 배송비 (정보성, refund_amount에 이미 반영)
        exchange_collected: exchangeShippingIncome,  // 교환 수취 배송비 (별도 수입)
        expense_out: shippingExpenseOut,
        net_income: shippingNetIncome,
        paid_order_count: paidShippingCount,
        free_order_count: freeShippingCount,
        remote_area_count: remoteAreaCount,
      },
      vat: {
        sales_tax_base: salesTaxBase,
        output_vat: outputVat,
        input_vat: inputVat,
        vat_payable: vatPayable,
        vat_deductible_expenses: vatDeductibleTotal,
      },
    });
  });
}
