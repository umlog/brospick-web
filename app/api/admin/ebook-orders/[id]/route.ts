import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return apiError('잘못된 요청입니다.', 400);

    const { error } = await supabaseAdmin
      .from('ebook_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('[admin/ebook-orders/delete] error:', error);
      return apiError('삭제에 실패했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  });
}
