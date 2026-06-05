import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

// 전체 리뷰 목록 조회
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id, rating, content, reviewer_name, created_at, images, height, usual_size, helpful_count,
        product_id,
        order_items(product_name, size)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/reviews] GET error:', error);
      return apiError('리뷰 조회에 실패했습니다.', 500);
    }

    const reviews = (data ?? []).map((r) => {
      const orderItem = Array.isArray(r.order_items) ? r.order_items[0] : r.order_items;
      const item = orderItem as { product_name: string; size: string } | null | undefined;
      return {
        id: r.id,
        rating: r.rating,
        content: r.content,
        reviewer_name: r.reviewer_name,
        created_at: r.created_at,
        images: r.images ?? [],
        height: r.height ?? null,
        usual_size: r.usual_size ?? null,
        helpful_count: r.helpful_count ?? 0,
        product_id: r.product_id,
        product_name: item?.product_name ?? '',
        size: item?.size ?? '',
      };
    });

    return NextResponse.json({ reviews });
  });
}

// 리뷰 삭제
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { reviewId } = await request.json();
    if (!reviewId) return apiError('reviewId가 필요합니다.', 400);

    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
    if (error) {
      console.error('[admin/reviews] DELETE error:', error);
      return apiError('리뷰 삭제에 실패했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  });
}
