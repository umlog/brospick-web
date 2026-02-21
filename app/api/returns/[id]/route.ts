import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { RETURN_POLICY } from '@/lib/constants';
import { sendReturnStatusEmail } from '@/lib/email';
import { sendReturnStatusAlimtalk } from '@/lib/kakao';

const VALID_TRANSITIONS: Record<string, string[]> = {
  '접수완료': ['승인', '거절'],
  '승인': ['수거중'],
  '수거중': ['수거완료'],
  '수거완료': ['처리완료'],
};

// 재고 조정 헬퍼: delta < 0이면 차감, delta > 0이면 증가
async function adjustStock(productId: number, size: string, delta: number) {
  const { data, error } = await supabaseAdmin
    .from('product_sizes')
    .select('stock, status')
    .match({ product_id: productId, size })
    .single();

  if (error || !data) return;

  const newStock = Math.max(0, data.stock + delta);
  const updateData: Record<string, unknown> = { stock: newStock, updated_at: new Date().toISOString() };

  if (newStock === 0 && data.status === 'available') {
    updateData.status = 'sold_out';
  }
  if (newStock > 0 && data.status === 'sold_out') {
    updateData.status = 'available';
  }

  await supabaseAdmin
    .from('product_sizes')
    .update(updateData)
    .match({ product_id: productId, size });
}

// 교환/반품 상태 변경 (관리자)
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
    const {
      status,
      rejectReason,
      returnTrackingNumber,
      refundCompleted,
      sendNotification,
    } = body;

    // 현재 요청 조회
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('return_requests')
      .select(`
        *,
        orders (
          order_number,
          customer_name,
          customer_phone,
          customer_email
        ),
        order_items (
          product_id,
          product_name,
          size,
          quantity,
          price
        )
      `)
      .eq('id', params.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: '교환/반품 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 전이 검증
    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `'${current.status}'에서 '${status}'로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 거절 시 사유 필수
    if (status === '거절' && !rejectReason) {
      return NextResponse.json(
        { error: '거절 사유를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 수거중 시 운송장번호 필수
    if (status === '수거중' && !returnTrackingNumber) {
      return NextResponse.json(
        { error: '반품 운송장번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === '거절') {
      updateData.reject_reason = rejectReason;
    }

    if (status === '수거중') {
      updateData.return_tracking_number = returnTrackingNumber;
    }

    if (status === '승인' && current.type === '반품' && !current.refund_amount) {
      const itemPrice = Array.isArray(current.order_items)
        ? current.order_items[0]?.price
        : current.order_items?.price;
      if (itemPrice) {
        updateData.refund_amount = itemPrice * current.quantity - RETURN_POLICY.returnShippingFee;
        updateData.return_shipping_fee = RETURN_POLICY.returnShippingFee;
      }
    }

    if (refundCompleted !== undefined) {
      updateData.refund_completed = refundCompleted;
    }

    const { data, error } = await supabaseAdmin
      .from('return_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Return request update error:', error);
      return NextResponse.json(
        { error: `상태 변경에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    // ── 재고 조정 ──────────────────────────────────────────────────
    const orderItem = Array.isArray(current.order_items)
      ? current.order_items[0]
      : current.order_items;
    const productId = orderItem?.product_id ?? null;

    // 교환 승인: 교환 요청 사이즈 재고 차감 (교환품 예약)
    if (status === '승인' && current.type === '교환' && current.exchange_size && productId) {
      await adjustStock(productId, current.exchange_size, -current.quantity);
    }

    // 처리완료: 반품/교환 모두 원래 사이즈 재고 증가 (반품 물건 입고)
    if (status === '처리완료' && orderItem?.size && productId) {
      await adjustStock(productId, orderItem.size, current.quantity);
    }
    // ──────────────────────────────────────────────────────────────

    // 알림 발송
    if (sendNotification && current.orders) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

      if (current.orders.customer_email) {
        sendReturnStatusEmail({
          requestNumber: current.request_number,
          orderNumber: current.orders.order_number,
          customerName: current.orders.customer_name,
          customerEmail: current.orders.customer_email,
          type: current.type,
          status,
          rejectReason,
          refundAmount: current.refund_amount || data.refund_amount,
          returnTrackingNumber,
          trackingUrl: `${siteUrl}/tracking?orderNumber=${encodeURIComponent(current.orders.order_number)}`,
        }).catch((err) => console.error('Return status email error:', err));
      }

      if (current.orders.customer_phone) {
        sendReturnStatusAlimtalk({
          customerPhone: current.orders.customer_phone,
          requestNumber: current.request_number,
          orderNumber: current.orders.order_number,
          type: current.type,
          status,
          siteUrl,
        }).catch((err) => console.error('Return status alimtalk error:', err));
      }
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error('Return request update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 교환/반품 삭제 (관리자)
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
      .from('return_requests')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Return request delete error:', error);
      return NextResponse.json(
        { error: `삭제에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Return request delete API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
