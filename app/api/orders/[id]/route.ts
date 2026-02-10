import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendStatusChangeEmail } from '@/lib/email';
import { sendStatusAlimtalk } from '@/lib/kakao';

// 주문 삭제 (관리자)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const password = request.headers.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Order delete error:', error);
      return NextResponse.json(
        { error: '주문 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order delete API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 주문 상태 변경 (관리자)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const password = request.headers.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { status, sendNotification, trackingNumber } = body;

    const validStatuses = ['입금대기', '입금확인', '배송중', '배송완료'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = { status };
    if (trackingNumber && status === '배송중') {
      updateData.tracking_number = trackingNumber;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
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
          trackingNumber: data.tracking_number || undefined,
        }).catch((err) => console.error('Status email error:', err));
      }

      // 카카오톡 알림톡 발송
      if (data.customer_phone) {
        // 주문 상품명 조회
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('product_name')
          .eq('order_id', data.id);
        const productName = items?.map((i: { product_name: string }) => i.product_name).join(', ') || '';

        sendStatusAlimtalk({
          customerPhone: data.customer_phone,
          orderNumber: data.order_number,
          productName,
          status,
          siteUrl,
        }).catch((err) => console.error('Status alimtalk error:', err));
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
