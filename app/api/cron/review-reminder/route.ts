import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReviewReminderEmail } from '@/lib/email/review-emails';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // CRON_SECRET 인증
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 배송완료 3일 이상 경과 + 마케팅 동의 + 리뷰 요청 미발송 + 이메일 있는 주문 조회
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email')
    .eq('marketing_consent', true)
    .not('delivered_at', 'is', null)
    .lte('delivered_at', threeDaysAgo)
    .is('review_reminder_sent_at', null)
    .not('customer_email', 'is', null)
    .neq('customer_email', '');

  if (error) {
    console.error('[review-reminder] 주문 조회 실패:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0, message: '발송 대상 없음' });
  }

  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      await sendReviewReminderEmail({
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        orderNumber: order.order_number,
      });

      // 발송 완료 표시
      await supabase
        .from('orders')
        .update({ review_reminder_sent_at: new Date().toISOString() })
        .eq('id', order.id);

      sent++;
    } catch (err) {
      console.error(`[review-reminder] 발송 실패 (${order.order_number}):`, err);
      failed++;
    }
  }

  console.log(`[review-reminder] 완료 - 발송: ${sent}건, 실패: ${failed}건`);
  return NextResponse.json({ sent, failed });
}
