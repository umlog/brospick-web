import { NextRequest, NextResponse } from 'next/server';
import { sendNewOrderNotificationEmail } from '@/lib/email';
import { sendOrderAlimtalk } from '@/lib/kakao';

// Supabase Database Webhook → 카카오페이 주문 알림 발송
// Supabase: orders 테이블 UPDATE 이벤트에서 호출됨
// 조건: status가 '입금확인'으로 변경 + payment_method = '카카오페이'

const WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // 시크릿 검증
  const secret = request.headers.get('x-webhook-secret');
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: {
    type: string;
    record: Record<string, unknown>;
    old_record: Record<string, unknown> | null;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, record, old_record } = payload;

  // UPDATE 이벤트만 처리
  if (type !== 'UPDATE') {
    return NextResponse.json({ skipped: 'not an update' });
  }

  const newStatus = record.status as string;
  const oldStatus = old_record?.status as string | undefined;
  const paymentMethod = record.payment_method as string;

  // 카카오페이 주문이 '입금확인'으로 전환된 경우만 처리 (중복 방지)
  if (paymentMethod !== '카카오페이' || newStatus !== '입금확인' || oldStatus === '입금확인') {
    return NextResponse.json({ skipped: 'condition not met' });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const orderNumber = record.order_number as string;

  // order_items는 webhook payload에 포함되지 않으므로 Supabase에서 직접 조회
  // — webhook에서 join이 안 되므로 별도 조회
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_name, size, quantity, price')
    .eq('order_id', record.id);

  const items = (orderItems ?? []).map((i) => ({
    productName: i.product_name as string,
    size: i.size as string,
    quantity: i.quantity as number,
    price: i.price as number,
  }));

  const trackingUrl = `${siteUrl}/tracking?orderNumber=${encodeURIComponent(orderNumber)}`;

  try {
    await sendNewOrderNotificationEmail({
      orderNumber,
      customerName: record.customer_name as string,
      customerEmail: (record.customer_email as string) ?? '',
      totalAmount: record.total_amount as number,
      shippingFee: record.shipping_fee as number,
      depositorName: record.customer_name as string,
      items,
      address: record.address as string,
      addressDetail: (record.address_detail as string) ?? undefined,
      trackingUrl,
      paymentMethod: '카카오페이',
    });
  } catch (err) {
    console.error('[order-notify] 관리자 이메일 발송 실패:', err);
  }

  // 알림톡은 fire-and-forget (실패해도 무방)
  sendOrderAlimtalk({
    customerPhone: record.customer_phone as string,
    orderNumber,
    productName: items.map((i) => i.productName).join(', '),
    totalAmount: record.total_amount as number,
    depositorName: record.customer_name as string,
    siteUrl,
  }).catch((err) => console.error('[order-notify] 알림톡 발송 실패:', err));

  return NextResponse.json({ ok: true });
}
