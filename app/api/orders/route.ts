import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from '@/lib/email';
import { sendOrderAlimtalk } from '@/lib/kakao';

type OrderItem = {
  productId?: number;
  productName: string;
  size: string;
  quantity: number;
  price: number;
};

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BP-${date}-${random}`;
}

// 재고 확인: 주문 가능 여부 체크
async function checkStock(items: OrderItem[]): Promise<{ ok: boolean; message?: string }> {
  const itemsWithProduct = items.filter((item) => item.productId != null);
  if (itemsWithProduct.length === 0) return { ok: true };

  for (const item of itemsWithProduct) {
    // maybeSingle(): 행 없으면 data=null/error=null, 실제 오류면 error 세팅
    const { data, error } = await supabaseAdmin
      .from('product_sizes')
      .select('status, stock')
      .eq('product_id', item.productId!)
      .eq('size', item.size)
      .maybeSingle();

    if (error) {
      console.error('Stock check DB error:', error);
      continue; // DB 오류면 이 항목 스킵 (관리자 수동 처리)
    }

    if (!data) continue; // product_sizes에 등록 안 된 상품 → 재고 관리 대상 아님

    if (data.status === 'sold_out') {
      return {
        ok: false,
        message: `${item.productName} ${item.size} 사이즈가 품절되었습니다.`,
      };
    }

    // 재고 0 (status가 아직 sold_out으로 안 바뀐 경우 포함)
    if (data.stock <= 0) {
      return {
        ok: false,
        message: `${item.productName} ${item.size} 사이즈가 품절되었습니다.`,
      };
    }

    // 주문 수량이 재고보다 많은 경우
    if (item.quantity > data.stock) {
      return {
        ok: false,
        message: `${item.productName} ${item.size} 사이즈의 재고가 부족합니다. (남은 재고: ${data.stock}개)`,
      };
    }
  }

  return { ok: true };
}

// 재고 차감: 주문 완료 후 호출
async function decrementStock(items: OrderItem[]): Promise<void> {
  const itemsWithProduct = items.filter((item) => item.productId != null);
  if (itemsWithProduct.length === 0) return;

  await Promise.all(
    itemsWithProduct.map(async (item) => {
      try {
        // RPC 함수가 있으면 원자적으로 처리 (race condition 방지)
        const { error: rpcError } = await supabaseAdmin.rpc('decrement_stock', {
          p_product_id: item.productId!,
          p_size: item.size,
          p_quantity: item.quantity,
        });

        if (rpcError) {
          // RPC 없는 경우: select → update fallback
          const { data: current } = await supabaseAdmin
            .from('product_sizes')
            .select('stock, status')
            .eq('product_id', item.productId!)
            .eq('size', item.size)
            .single();

          if (!current) return;

          const newStock = Math.max(0, current.stock - item.quantity);
          const updateData: { stock: number; status?: string } = { stock: newStock };

          // 재고 0 도달 시 자동 품절 처리 (delayed 상태는 유지)
          if (newStock === 0 && current.status === 'available') {
            updateData.status = 'sold_out';
          }

          await supabaseAdmin
            .from('product_sizes')
            .update(updateData)
            .eq('product_id', item.productId!)
            .eq('size', item.size);
        } else {
          // RPC 성공 후에도 stock=0이면 status 업데이트 (RPC가 status를 바꾸지 않는 경우 대비)
          const { data: afterRpc } = await supabaseAdmin
            .from('product_sizes')
            .select('stock, status')
            .eq('product_id', item.productId!)
            .eq('size', item.size)
            .single();

          if (afterRpc && afterRpc.stock === 0 && afterRpc.status === 'available') {
            await supabaseAdmin
              .from('product_sizes')
              .update({ status: 'sold_out' })
              .eq('product_id', item.productId!)
              .eq('size', item.size);
          }
        }
      } catch (err) {
        console.error('Stock decrement error:', err);
        // 재고 차감 실패는 주문 자체를 실패시키지 않음 (관리자가 수동 처리)
      }
    })
  );
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
      deliveryNote,
      items,
    } = body;

    // 필수 필드 검증
    if (!customerName || !customerPhone || !postalCode || !address || !items?.length) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 재고 확인 (주문 생성 전)
    const stockCheck = await checkStock(items as OrderItem[]);
    if (!stockCheck.ok) {
      return NextResponse.json(
        { error: stockCheck.message },
        { status: 409 }
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
        delivery_note: deliveryNote || null,
        payment_method: '무통장입금',
        status: '입금대기',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: `주문 생성에 실패했습니다: ${orderError.message}` },
        { status: 500 }
      );
    }

    // 주문 상품 생성
    const orderItems = (items as OrderItem[]).map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
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
    }

    // 재고 차감 (비동기 - 주문 응답 지연시키지 않음)
    decrementStock(items as OrderItem[]).catch((err) =>
      console.error('Stock decrement failed:', err)
    );

    // 이메일 발송 (비동기)
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
        trackingUrl: `${siteUrl}/tracking?orderNumber=${encodeURIComponent(order.order_number)}`,
      }).catch((err) => console.error('Email send error:', err));
    }

    // 관리자 알림 이메일 발송 (비동기)
    sendNewOrderNotificationEmail({
      orderNumber: order.order_number,
      customerName: customerName,
      customerEmail: customerEmail || '',
      totalAmount: order.total_amount,
      shippingFee: order.shipping_fee,
      depositorName: depositorName || customerName,
      items,
      address,
      addressDetail,
      trackingUrl: `${siteUrl}/tracking?orderNumber=${encodeURIComponent(order.order_number)}`,
    }).catch((err) => console.error('Admin notification email error:', err));

    // 카카오톡 알림톡 발송 (비동기)
    const productNames = (items as OrderItem[]).map((item) => item.productName).join(', ');
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
