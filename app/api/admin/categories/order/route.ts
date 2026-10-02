import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { revalidateProductList } from '@/lib/cache';
import { CATEGORY_LABELS } from '@/lib/products';
import { CATEGORY_ORDER_KEY, parseCategoryOrder } from '@/lib/category-order';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', CATEGORY_ORDER_KEY)
      .maybeSingle();
    if (error) return apiError(error.message, 500);

    return NextResponse.json({ order: parseCategoryOrder(data?.value) });
  });
}

export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const { order } = (await request.json()) as { order?: unknown };
    const categoryCount = Object.keys(CATEGORY_LABELS).length;
    const isValid =
      Array.isArray(order) &&
      order.length === categoryCount &&
      new Set(order).size === categoryCount &&
      order.every((cat) => typeof cat === 'string' && cat in CATEGORY_LABELS);
    if (!isValid) return apiError('모든 카테고리가 한 번씩 들어간 order 배열이 필요합니다.', 400);

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key: CATEGORY_ORDER_KEY, value: JSON.stringify(order), updated_at: new Date().toISOString() });
    if (error) return apiError(error.message, 500);

    revalidateProductList();

    return NextResponse.json({ order });
  });
}
