import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return apiError(`지출 수정 실패: ${error.message}`, 500);
    return NextResponse.json(data);
  });
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', params.id);

    if (error) return apiError(`지출 삭제 실패: ${error.message}`, 500);
    return NextResponse.json({ success: true });
  });
}
