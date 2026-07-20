import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { ACTUAL_SHIPPING_UNIT_COST } from '@/lib/constants';

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
        .select('amount, status, created_at')
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

    // 상품별 사입가 이력 (effective_date 내림차순 — 쿼리 정렬 유지)
    const costsByProduct = new Map<number, { date: string; price: number }[]>();
    for (const c of costs) {
      const list = costsByProduct.get(c.product_id);
      if (list) list.push({ date: c.effective_date, price: c.cost_price });
      else costsByProduct.set(c.product_id, [{ date: c.effective_date, price: c.cost_price }]);
    }

    // 주문 시점에 유효했던 사입가. 이력 시작 전 주문은 가장 오래된 사입가로 근사
    const costPriceAt = (productId: number, orderDate: string): number | null => {
      const list = costsByProduct.get(productId);
      if (!list) return null;
      const effective = list.find((c) => c.date <= orderDate);
      return (effective ?? list[list.length - 1]).price;
    };

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

    // COGS 계산 (원가 등록된 상품만, 주문 날짜 기준 사입가 적용)
    let cogs = 0;
    for (const order of revenueOrders) {
      const orderDate = order.created_at.slice(0, 10);
      const items = (order.order_items as { product_id: number | null; quantity: number }[]) ?? [];
      for (const item of items) {
        const costPrice = item.product_id ? costPriceAt(item.product_id, orderDate) : null;
        if (costPrice !== null) cogs += costPrice * item.quantity;
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
    // 추정 지출: 실제 택배가 나간 건만 집계 — 발송(배송중·배송완료) 1회 + 반품 수거 1회 + 교환 왕복 2회
    const shippedOrderCount = revenueOrders.filter(
      (o) => o.status === OrderStatus.SHIPPING || o.status === OrderStatus.DELIVERED
    ).length;
    const shippingExpenseEstimated =
      (shippedOrderCount + completedReturns.length + exchanges.length * 2) * ACTUAL_SHIPPING_UNIT_COST;
    // 청구서(실입력)가 있으면 그 값을, 없으면 추정치를 손익에 사용
    const shippingExpenseIsEstimated = shippingExpenseOut === 0;
    const shippingExpenseEffective = shippingExpenseIsEstimated ? shippingExpenseEstimated : shippingExpenseOut;
    const shippingNetIncome =
      shippingCollected + returnShippingCollected + exchangeShippingIncome - shippingExpenseEffective;
    // 무료배송 정책 부담 참고치 (5만원 이상 무료 기준 적정성 판단용)
    const freeShippingBurden = freeShippingCount * ACTUAL_SHIPPING_UNIT_COST;

    // 월별 추이 (KST 기준 월, 총매출 기준 — 환불 미반영 단순 추이)
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const kstMonth = (iso: string) =>
      new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 7);

    const monthlyMap = new Map<string, { revenue: number; ebook: number; expenses: number }>();
    const monthEntry = (month: string) => {
      let entry = monthlyMap.get(month);
      if (!entry) {
        entry = { revenue: 0, ebook: 0, expenses: 0 };
        monthlyMap.set(month, entry);
      }
      return entry;
    };
    for (const o of revenueOrders) monthEntry(kstMonth(o.created_at)).revenue += o.total_amount;
    for (const e of ebookOrders) monthEntry(kstMonth(e.created_at)).ebook += e.amount;
    for (const e of expenses) monthEntry(e.date.slice(0, 7)).expenses += e.amount;

    const monthly = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, m]) => ({
        month,
        revenue: m.revenue,
        ebook: m.ebook,
        expenses: m.expenses,
        profit: m.revenue + m.ebook - m.expenses,
      }));

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
      monthly,
      shipping: {
        collected: shippingCollected,
        return_collected: returnShippingCollected,   // 반품 수취 배송비 (정보성, refund_amount에 이미 반영)
        exchange_collected: exchangeShippingIncome,  // 교환 수취 배송비 (별도 수입)
        expense_out: shippingExpenseOut,
        expense_estimated: shippingExpenseEstimated,
        expense_is_estimated: shippingExpenseIsEstimated,
        net_income: shippingNetIncome,
        paid_order_count: paidShippingCount,
        free_order_count: freeShippingCount,
        remote_area_count: remoteAreaCount,
        shipped_order_count: shippedOrderCount,
        free_shipping_burden: freeShippingBurden,
        unit_cost: ACTUAL_SHIPPING_UNIT_COST,
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
