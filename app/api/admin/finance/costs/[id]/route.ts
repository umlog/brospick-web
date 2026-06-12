import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('product_costs')
      .update(body)
      .eq('id', params.id)
      .select('*, products(name)')
      .single();

    if (error) return apiError(`원가 수정 실패: ${error.message}`, 500);
    return NextResponse.json(data);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { error } = await supabaseAdmin
      .from('product_costs')
      .delete()
      .eq('id', params.id);

    if (error) return apiError(`원가 삭제 실패: ${error.message}`, 500);
    return NextResponse.json({ success: true });
  });
}
