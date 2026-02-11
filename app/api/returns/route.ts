import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { RETURN_POLICY } from '@/lib/constants';
import { sendReturnRequestEmail } from '@/lib/email';
import { sendReturnRequestAlimtalk } from '@/lib/kakao';

function generateRequestNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `RR-${date}-${random}${suffix}`;
}

// 교환/반품 신청 (고객)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      phone,
      orderItemId,
      type,
      reason,
      exchangeSize,
      quantity,
      refundBank,
      refundAccount,
      refundHolder,
    } = body;

    // 필수 필드 검증
    if (!orderNumber || !phone || !orderItemId || !type || !reason) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['교환', '반품'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청 유형입니다.' },
        { status: 400 }
      );
    }

    if (type === '교환' && !exchangeSize) {
      return NextResponse.json(
        { error: '교환 희망 사이즈를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (type === '반품' && (!refundBank || !refundAccount || !refundHolder)) {
      return NextResponse.json(
        { error: '환불 계좌 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 주문 조회 + 인증
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, delivered_at, customer_name, customer_phone, customer_email')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.' },
        { status: 404 }
      );
    }

    // 배송완료 상태 확인
    if (order.status !== '배송완료') {
      return NextResponse.json(
        { error: '배송완료된 주문만 교환/반품 신청이 가능합니다.' },
        { status: 400 }
      );
    }

    // 7일 이내 확인
    if (order.delivered_at) {
      const deliveredDate = new Date(order.delivered_at);
      const now = new Date();
      const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > RETURN_POLICY.windowDays) {
        return NextResponse.json(
          { error: `배송완료 후 ${RETURN_POLICY.windowDays}일이 지나 교환/반품 신청이 불가합니다.` },
          { status: 400 }
        );
      }
    }

    // 주문 아이템 확인
    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_name, size, quantity, price')
      .eq('id', orderItemId)
      .eq('order_id', order.id)
      .single();

    if (itemError || !orderItem) {
      return NextResponse.json(
        { error: '해당 주문 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 동일 아이템에 대한 활성 요청 중복 체크
    const { data: existingRequests } = await supabaseAdmin
      .from('return_requests')
      .select('id')
      .eq('order_item_id', orderItemId)
      .not('status', 'in', '("처리완료","거절")');

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json(
        { error: '이미 진행 중인 교환/반품 요청이 있습니다.' },
        { status: 400 }
      );
    }

    const returnQuantity = quantity || orderItem.quantity;

    // 교환/반품 요청 생성 (요청번호 충돌 시 최대 3회 재시도)
    let requestNumber = '';
    let insertError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      requestNumber = generateRequestNumber();

      const insertData: Record<string, unknown> = {
        order_id: order.id,
        order_item_id: orderItemId,
        request_number: requestNumber,
        type,
        reason,
        quantity: returnQuantity,
        status: '접수완료',
      };

      if (type === '교환') {
        insertData.exchange_size = exchangeSize;
      }

      if (type === '반품') {
        insertData.refund_bank = refundBank;
        insertData.refund_account = refundAccount;
        insertData.refund_holder = refundHolder;
        insertData.refund_amount = orderItem.price * returnQuantity;
      }

      const result = await supabaseAdmin
        .from('return_requests')
        .insert(insertData);

      insertError = result.error;
      if (!insertError) break;

      // UNIQUE 제약 위반이 아니면 즉시 실패
      if (!insertError.message?.includes('unique') && !insertError.code?.includes('23505')) {
        break;
      }
    }

    if (insertError) {
      console.error('Return request creation error:', insertError);
      return NextResponse.json(
        { error: '교환/반품 신청에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 알림 발송 (비동기)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    if (order.customer_email) {
      sendReturnRequestEmail({
        requestNumber,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        type,
        productName: orderItem.product_name,
        currentSize: orderItem.size,
        exchangeSize,
        reason,
        trackingUrl: `${siteUrl}?track=true`,
      }).catch((err) => console.error('Return request email error:', err));
    }

    sendReturnRequestAlimtalk({
      customerPhone: order.customer_phone,
      requestNumber,
      orderNumber: order.order_number,
      type,
      productName: orderItem.product_name,
      siteUrl,
    }).catch((err) => console.error('Return request alimtalk error:', err));

    return NextResponse.json({
      requestNumber,
      status: '접수완료',
    });
  } catch (error) {
    console.error('Return request API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 교환/반품 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('return_requests')
    .select(`
      *,
      orders (
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        address,
        address_detail,
        postal_code
      ),
      order_items (
        product_name,
        size,
        quantity,
        price
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Return requests fetch error:', error);
    return NextResponse.json(
      { error: '교환/반품 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ requests: data });
}
