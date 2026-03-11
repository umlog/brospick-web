import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

// 마케팅 수신 동의 철회 (관리자)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ marketing_consent: false })
      .eq('id', params.id);

    if (error) {
      return apiError('마케팅 동의 철회에 실패했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  });
}
