import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // 내부 서버 간 호출만 허용 (클라이언트 직접 호출 차단)
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  const authHeader = request.headers.get('Authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, used_count')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (!coupon) return NextResponse.json({ success: true }); // 쿠폰 없어도 주문은 통과

  const { error } = await supabase
    .from('coupons')
    .update({ used_count: coupon.used_count + 1, updated_at: new Date().toISOString() })
    .eq('id', coupon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
