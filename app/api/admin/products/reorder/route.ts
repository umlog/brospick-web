import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const { orders } = body as { orders: { id: number; sort_order: number }[] };

    if (!Array.isArray(orders) || orders.length === 0) {
      return apiError('orders 배열이 필요합니다.', 400);
    }

    const updates = orders.map(({ id, sort_order }) =>
      supabaseAdmin.from('products').update({ sort_order }).eq('id', id)
    );

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);

    if (failed.length > 0) {
      return apiError(`${failed.length}개 상품 순서 저장 실패`, 500);
    }

    return NextResponse.json({ ok: true });
  });
}
