import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 주문 조회 (공개 - 주문번호 + 전화번호로 인증)
export async function POST(request: NextRequest) {
  try {
    const { orderNumber, phone } = await request.json();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: '주문번호와 전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        order_number,
        status,
        total_amount,
        shipping_fee,
        payment_method,
        created_at,
        order_items (
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

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order track error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
