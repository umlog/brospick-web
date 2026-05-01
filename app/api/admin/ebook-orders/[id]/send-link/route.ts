import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEbookDownloadLink } from '@/lib/email/ebook-emails';

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
      .select('id, order_number, name, email, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) return apiError('주문을 찾을 수 없습니다.', 404);
    if (order.status === 'pending_payment') {
      return apiError('입금 확인 후 발송할 수 있습니다.', 400);
    }

    // 토큰 생성 (DB default가 gen_random_uuid()이지만 명시적으로 생성)
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('ebook_download_tokens')
      .insert({ order_id: orderId })
      .select('token, expires_at')
      .single();

    if (tokenError || !tokenRow) {
      console.error('[admin/ebook-orders/send-link] token error:', tokenError);
      return apiError('토큰 생성에 실패했습니다.', 500);
    }

    // 베이스 URL: 요청 origin 사용
    const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const downloadUrl = `${origin}/api/ebook/download?token=${tokenRow.token}`;

    await sendEbookDownloadLink({
      name: order.name,
      email: order.email,
      orderNumber: order.order_number,
      downloadUrl,
      expiresAt: tokenRow.expires_at,
    });

    // 주문 상태 업데이트
    await supabaseAdmin
      .from('ebook_orders')
      .update({ status: 'download_sent', download_sent_at: new Date().toISOString() })
      .eq('id', orderId);

    return NextResponse.json({ success: true });
  });
}
