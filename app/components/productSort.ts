import type { DbPrice } from './ProductGrid';

export type SortMode = 'recommended' | 'price_desc' | 'price_asc';

export const SORT_MODES: SortMode[] = ['recommended', 'price_desc', 'price_asc'];

export const SORT_LABELS: Record<SortMode, string> = {
  recommended: '추천순',
  price_desc: '가격 높은순',
  price_asc: '가격 낮은순',
};

/**
 * 목록 정렬 규칙
 * - Coming Soon 상품은 항상 마지막
 * - 추천순은 어드민 핀(sort_order)이 최우선. BEST 배지는 표시용일 뿐 순서에 개입하지 않는다
 */
export function sortProducts<T extends { id: number; comingSoon?: boolean }>(
  products: T[],
  dbPrices: Record<number, DbPrice>,
  sortMode: SortMode,
): T[] {
  return [...products].sort((a, b) => {
    const aDb = dbPrices[a.id];
    const bDb = dbPrices[b.id];
    const aSortOrder = aDb?.sort_order ?? null;
    const bSortOrder = bDb?.sort_order ?? null;
    const aComingSoon = aDb ? aDb.coming_soon : a.comingSoon;
    const bComingSoon = bDb ? bDb.coming_soon : b.comingSoon;
    const aPrice = aDb?.price ?? 0;
    const bPrice = bDb?.price ?? 0;

    if (!aComingSoon && bComingSoon) return -1;
    if (aComingSoon && !bComingSoon) return 1;
    if (aComingSoon && bComingSoon) return 0;

    if (sortMode === 'recommended') {
      if (aSortOrder !== null && bSortOrder !== null) return aSortOrder - bSortOrder;
      if (aSortOrder !== null) return -1;
      if (bSortOrder !== null) return 1;
      return bPrice - aPrice;
    }
    if (sortMode === 'price_desc') return bPrice - aPrice;
    if (sortMode === 'price_asc') return aPrice - bPrice;
    return 0;
  });
}
