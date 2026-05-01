import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { data, error } = await supabaseAdmin
      .from('ebook_orders')
      .select('id, order_number, name, phone, email, amount, status, download_sent_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/ebook-orders] GET error:', error);
      return apiError('조회에 실패했습니다.', 500);
    }

    return NextResponse.json({ orders: data });
  });
}
