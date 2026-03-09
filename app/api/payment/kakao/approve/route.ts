import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { inventoryService, type StockableItem } from '@/lib/services/inventory.service';
import { notificationService } from '@/lib/services';
import { OrderStatus } from '@/lib/domain/enums';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pgToken = searchParams.get('pg_token');
  const orderNumber = searchParams.get('order');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const secretKey = process.env.KAKAO_PAY_SECRET_KEY!;
  const cid = process.env.KAKAO_PAY_CID!;

  if (!pgToken || !orderNumber) {
    return NextResponse.redirect(`${siteUrl}/checkout?error=payment_failed`);
  }

  try {
    // 주문 조회
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !order) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=payment_failed`);
    }

    // 멱등성: 이미 입금확인 상태면 완료 페이지로 리다이렉트
    if (order.status === OrderStatus.PAYMENT_CONFIRMED) {
      return NextResponse.redirect(
        `${siteUrl}/order-complete?order=${orderNumber}&amount=${order.total_amount}&method=kakao`
      );
    }

    if (!order.kakao_tid) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=payment_failed`);
    }

    // KakaoPay Approve API 호출
    const kakaoRes = await fetch('https://open-api.kakaopay.com/online/v1/payment/approve', {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid,
        tid: order.kakao_tid,
        partner_order_id: orderNumber,
        partner_user_id: order.customer_phone,
        pg_token: pgToken,
      }),
    });

    if (!kakaoRes.ok) {
      const err = await kakaoRes.json().catch(() => ({}));
      console.error('KakaoPay approve error:', err);
      return NextResponse.redirect(`${siteUrl}/checkout?error=payment_failed`);
    }

    // 주문 상태 업데이트
    await supabaseAdmin
      .from('orders')
      .update({ status: OrderStatus.PAYMENT_CONFIRMED })
      .eq('order_number', orderNumber);

    // 재고 차감
    const stockItems = (order.order_items as Array<{ product_id: number | null; size: string; quantity: number }>)
      .filter((i) => i.product_id)
      .map((i) => ({ productId: i.product_id!, productName: '', size: i.size, quantity: i.quantity, price: 0 }));

    if (stockItems.length > 0) {
      inventoryService.decrementStock(stockItems as StockableItem[]).catch((err) =>
        console.error('Stock decrement failed:', err)
      );
    }

    // 알림 발송 (비동기)
    const items = (order.order_items as Array<{ product_name: string; size: string; quantity: number; price: number }>)
      .map((i) => ({ productName: i.product_name, size: i.size, quantity: i.quantity, price: i.price }));

    notificationService.notifyOrderCreated({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      totalAmount: order.total_amount,
      shippingFee: order.shipping_fee,
      depositorName: order.customer_name,
      items,
      address: order.address,
      addressDetail: order.address_detail,
      siteUrl,
    });

    return NextResponse.redirect(
      `${siteUrl}/order-complete?order=${orderNumber}&amount=${order.total_amount}&method=kakao`
    );
  } catch (err) {
    console.error('KakaoPay approve handler error:', err);
    return NextResponse.redirect(`${siteUrl}/checkout?error=payment_failed`);
  }
}
