import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return apiError('잘못된 요청입니다.', 400);

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('ebook_orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) return apiError('주문을 찾을 수 없습니다.', 404);
    if (order.status !== 'pending_payment') {
      return apiError('이미 입금 확인된 주문입니다.', 409);
    }

    const { error } = await supabaseAdmin
      .from('ebook_orders')
      .update({ status: 'payment_confirmed' })
      .eq('id', orderId);

    if (error) {
      console.error('[admin/ebook-orders/confirm] error:', error);
      return apiError('처리 중 오류가 발생했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  });
}
