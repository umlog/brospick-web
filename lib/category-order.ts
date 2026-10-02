// 카테고리 노출 순서 — site_settings 에 JSON 배열로 저장한다. 서버 전용.
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from '@/lib/cache';
import { ProductCategory, resolveCategoryOrder } from '@/lib/products';

export const CATEGORY_ORDER_KEY = 'category_order';

export function parseCategoryOrder(value: string | null | undefined): ProductCategory[] {
  if (!value) return resolveCategoryOrder(null);
  try {
    return resolveCategoryOrder(JSON.parse(value));
  } catch (err) {
    console.error('[category-order] 저장값 파싱 실패:', { value, err });
    return resolveCategoryOrder(null);
  }
}

async function fetchCategoryOrder(): Promise<ProductCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', CATEGORY_ORDER_KEY)
    .maybeSingle();
  if (error) {
    console.error('[category-order] 조회 실패:', error.message);
    return resolveCategoryOrder(null);
  }
  return parseCategoryOrder(data?.value);
}

/**
 * 공개 페이지용. site_settings 는 anon 조회가 막혀 있어 service role 로 읽고,
 * 목록 페이지와 같은 태그로 캐시해 어드민 저장 시 함께 갱신한다.
 */
export const getCategoryOrder = unstable_cache(fetchCategoryOrder, [CATEGORY_ORDER_KEY], {
  tags: [CACHE_TAGS.productList],
  revalidate: CACHE_REVALIDATE_SECONDS,
});
