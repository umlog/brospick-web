import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { sendOrderAlimtalk } from '@/lib/kakao';

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BP-${date}-${random}`;
}

// 주문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      postalCode,
      address,
      addressDetail,
      totalAmount,
      shippingFee,
      depositorName,
      items,
    } = body;

    // 필수 필드 검증
    if (!customerName || !customerPhone || !postalCode || !address || !items?.length) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // 주문 생성
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        postal_code: postalCode,
        address: address,
        address_detail: addressDetail || null,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        depositor_name: depositorName || null,
        payment_method: '무통장입금',
        status: '입금대기',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: '주문 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 주문 상품 생성
    const orderItems = items.map((item: { productName: string; size: string; quantity: number; price: number }) => ({
      order_id: order.id,
      product_name: item.productName,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // 주문은 생성되었으므로 주문번호는 반환
    }

    // 이메일 발송 (입력한 경우만, 비동기 - 주문 응답을 지연시키지 않음)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';
    if (customerEmail) {
      sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName: customerName,
        customerEmail: customerEmail,
        totalAmount: order.total_amount,
        shippingFee: order.shipping_fee,
        depositorName: depositorName || customerName,
        items,
        address,
        addressDetail,
        trackingUrl: `${siteUrl}?track=true`,
      }).catch((err) => console.error('Email send error:', err));
    }

    // 카카오톡 알림톡 발송 (비동기)
    const productNames = items.map((item: { productName: string }) => item.productName).join(', ');
    sendOrderAlimtalk({
      customerPhone: customerPhone,
      orderNumber: order.order_number,
      productName: productNames,
      totalAmount: order.total_amount,
      depositorName: depositorName || customerName,
      siteUrl: siteUrl,
    }).catch((err) => console.error('Alimtalk send error:', err));

    return NextResponse.json({
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      shippingFee: order.shipping_fee,
    });
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 주문 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: '주문 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders: data });
}
