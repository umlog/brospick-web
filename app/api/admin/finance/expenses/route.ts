import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;
    if (error) return apiError(`지출 조회 실패: ${error.message}`, 500);
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const body = await request.json();
    const { date, category, amount, description, receipt_url, vat_deductible, note } = body;

    if (!date || !category || !amount || !description) {
      return apiError('필수 항목이 누락되었습니다.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({ date, category, amount, description, receipt_url, vat_deductible: vat_deductible ?? false, note })
      .select()
      .single();

    if (error) return apiError(`지출 추가 실패: ${error.message}`, 500);
    return NextResponse.json(data, { status: 201 });
  });
}
