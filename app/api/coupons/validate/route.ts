import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { code, order_amount } = await request.json();
  if (!code) return NextResponse.json({ error: '코드를 입력하세요.' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ error: '유효하지 않은 쿠폰 코드입니다.' }, { status: 404 });
  }

  // 만료일 확인
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: '만료된 쿠폰입니다.' }, { status: 400 });
  }

  // 사용 횟수 확인
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: '사용 한도가 초과된 쿠폰입니다.' }, { status: 400 });
  }

  // 최소 주문 금액 확인
  if (order_amount !== undefined && order_amount < coupon.min_order_amount) {
    return NextResponse.json({
      error: `최소 주문 금액 ${coupon.min_order_amount.toLocaleString()}원 이상 주문 시 사용 가능합니다.`,
    }, { status: 400 });
  }

  // 할인 금액 계산
  let discount = 0;
  if (coupon.discount_type === 'amount') {
    discount = coupon.discount_value;
  } else {
    discount = Math.floor((order_amount ?? 0) * coupon.discount_value / 100);
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
  }

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount,
    description: coupon.description,
  });
}
