import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// 상품 가격 조회 (공개)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, price, original_price, coming_soon, launched_at');

    if (error) return apiError(`가격 조회 실패: ${error.message}`, 500);

    return NextResponse.json({ prices: data });
  } catch (error) {
    console.error('Product prices API error:', error);
    return apiError('서버 오류가 발생했습니다.', 500);
  }
}
