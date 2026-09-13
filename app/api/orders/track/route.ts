import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

// 주문번호 뒷자리가 4자리라, 전화번호를 아는 사람이 날짜별로 대입해볼 수 있다. 횟수를 끊는다.
const TRACK_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

// 주문 조회 (공개 - 주문번호 + 전화번호로 인증)
export async function POST(request: NextRequest) {
  try {
    if (await isRateLimited(`orders:track:${clientIp(request)}`, TRACK_LIMIT)) {
      return NextResponse.json(
        { error: '조회 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const { orderNumber, phone } = await request.json();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: '주문번호와 전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        shipping_fee,
        discount_amount,
        payment_method,
        tracking_number,
        delivered_at,
        created_at,
        postal_code,
        order_items (
          id,
          product_name,
          size,
          quantity,
          price
        )
      `)
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.' },
        { status: 404 }
      );
    }

    // 교환/반품 요청 내역 조회
    const { data: returnRequests } = await supabaseAdmin
      .from('return_requests')
      .select('request_number, type, status, reason, exchange_size, quantity, reject_reason, refund_amount, refund_completed, return_tracking_number, created_at, order_item_id')
      .eq('order_id', order.id);

    return NextResponse.json({
      order: { ...order, return_requests: returnRequests || [] },
    });
  } catch (error) {
    console.error('Order track error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
