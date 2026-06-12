import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { data, error } = await supabaseAdmin
      .from('product_costs')
      .select('*, products(name)')
      .order('effective_date', { ascending: false });

    if (error) return apiError(`원가 조회 실패: ${error.message}`, 500);
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const body = await request.json();
    const { product_id, color, cost_price, effective_date, note } = body;

    if (!product_id || !cost_price || !effective_date) {
      return apiError('필수 항목이 누락되었습니다.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('product_costs')
      .insert({ product_id, color, cost_price, effective_date, note })
      .select('*, products(name)')
      .single();

    if (error) return apiError(`원가 추가 실패: ${error.message}`, 500);
    return NextResponse.json(data, { status: 201 });
  });
}
