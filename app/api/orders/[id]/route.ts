import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendStatusChangeEmail } from '@/lib/email';

// 주문 상태 변경 (관리자)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { password, status, sendNotification } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
    }

    const validStatuses = ['입금대기', '입금확인', '배송준비', '배송중', '배송완료'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
      return NextResponse.json(
        { error: '주문 상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 알림 발송
    if (sendNotification && data) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

      // 이메일 발송
      if (data.customer_email) {
        sendStatusChangeEmail({
          orderNumber: data.order_number,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          status,
          trackingUrl: `${siteUrl}?track=true`,
        }).catch((err) => console.error('Status email error:', err));
      }
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('Order update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
