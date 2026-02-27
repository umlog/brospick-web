import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendStatusChangeEmail, sendPaymentReminderEmail } from '@/lib/email';
import { sendStatusAlimtalk } from '@/lib/kakao';

// 재고 조정 헬퍼: delta < 0이면 차감, delta > 0이면 증가
async function adjustStock(productId: number, size: string, delta: number) {
  const { data, error } = await supabaseAdmin
    .from('product_sizes')
    .select('stock, status')
    .match({ product_id: productId, size })
    .single();

  if (error || !data) return; // 해당 사이즈 row 없으면 skip

  const newStock = Math.max(0, data.stock + delta);
  const updateData: Record<string, unknown> = { stock: newStock, updated_at: new Date().toISOString() };

  // stock 0 되면 sold_out (available인 경우만)
  if (newStock === 0 && data.status === 'available') {
    updateData.status = 'sold_out';
  }
  // stock 생기면 available 복구 (sold_out이었던 경우만, delayed는 건드리지 않음)
  if (newStock > 0 && data.status === 'sold_out') {
    updateData.status = 'available';
  }

  await supabaseAdmin
    .from('product_sizes')
    .update(updateData)
    .match({ product_id: productId, size });
}

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

    // 삭제 전 주문 상태와 order_items 조회 (재고 복구 여부 판단)
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, order_items(product_id, size, quantity)')
      .eq('id', params.id)
      .single();

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Order delete error:', error);
      return NextResponse.json(
        { error: `주문 삭제에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    // 입금확인 이후 상태였다면 재고 복구 (발송지연 포함)
    const stockRestoreStatuses = ['입금확인', '배송중', '배송완료'];
    const isDelayStatus = /^(\d+)주 뒤 발송$/.test(order?.status ?? '');
    if (order && (stockRestoreStatuses.includes(order.status) || isDelayStatus)) {
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      for (const item of items) {
        if (item.product_id) {
          await adjustStock(item.product_id, item.size, item.quantity);
        }
      }
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

// 입금 안내 메일 발송 (관리자)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const password = request.headers.get('x-admin-password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, customer_name, customer_email, total_amount')
      .eq('id', params.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: '고객 이메일이 없습니다.' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    await sendPaymentReminderEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      totalAmount: order.total_amount,
      trackingUrl: `${siteUrl}/tracking?orderNumber=${encodeURIComponent(order.order_number)}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment reminder email error:', error);
    return NextResponse.json(
      { error: '메일 발송에 실패했습니다.' },
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

    const DELAY_STATUS_REGEX = /^(\d+)주 뒤 발송$/;
    const validStatuses = ['입금대기', '입금확인', '배송중', '배송완료'];
    if (!validStatuses.includes(status) && !DELAY_STATUS_REGEX.test(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const isConfirmedStatus = (s: string) =>
      s === '입금확인' || DELAY_STATUS_REGEX.test(s);

    // 현재 주문 상태 조회 (재고 차감 판단용)
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status, order_items(product_id, size, quantity)')
      .eq('id', params.id)
      .single();

    const updateData: Record<string, unknown> = { status };
    if (trackingNumber && status === '배송중') {
      updateData.tracking_number = trackingNumber;
    }
    if (status === '배송완료') {
      updateData.delivered_at = new Date().toISOString();
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
        { error: `주문 상태 변경에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    // 입금확인 또는 발송지연으로 전환 시 재고 차감 (아직 차감되지 않은 경우만)
    if (isConfirmedStatus(status) && currentOrder && !isConfirmedStatus(currentOrder.status)) {
      const items = Array.isArray(currentOrder.order_items) ? currentOrder.order_items : [];
      for (const item of items) {
        if (item.product_id) {
          await adjustStock(item.product_id, item.size, -item.quantity);
        }
      }
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
          trackingUrl: `${siteUrl}/tracking?orderNumber=${encodeURIComponent(data.order_number)}`,
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
