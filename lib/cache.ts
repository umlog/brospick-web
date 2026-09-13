// =============================================================================
// 공개 페이지 데이터 캐시 — 태그와 즉시 갱신
//
// 상품·배너·팝업은 평소엔 캐시에서 읽고 DB를 부르지 않는다. 값이 실제로 바뀌는 곳
// (어드민 저장, 주문·취소·교환의 재고 변동, 리뷰 작성·수정·삭제)에서 태그를 갱신해
// 다음 방문 때 새로 만든다.
//
// 예전엔 5분(배너·팝업은 1분)마다 캐시가 끝나 상품 수십 개가 한꺼번에 다시 만들어졌고,
// 이게 Supabase 요청의 70% 이상이었다.
//
// CACHE_REVALIDATE_SECONDS 는 안전장치다. 즉시 갱신이 빠진 경로(대시보드에서 DB 직접
// 수정, 예약 배너의 시작·종료 시각 도래 등)가 있어도 이 시간 안에는 맞춰진다.
// =============================================================================

import { revalidateTag } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const CACHE_REVALIDATE_SECONDS = 3600;

export const CACHE_TAGS = {
  siteBanner: 'site-banner',
  sitePopup: 'site-popup',
  /** 목록 페이지(/apparel, /bootskin)의 가격·정렬·부츠스킨 재고 */
  productList: 'product-list',
  /** 상품 상세 페이지의 가격·재고·리뷰 */
  product: (productId: number) => `product-${productId}`,
} as const;

/**
 * 태그 갱신. 캐시 갱신 실패로 주문·어드민 저장 자체를 실패시키지 않는다 —
 * 안전장치 시간 안에는 어차피 맞춰지므로 로그만 남긴다.
 */
function revalidate(tag: string) {
  try {
    revalidateTag(tag);
  } catch (err) {
    console.error('[cache] 태그 갱신 실패:', { tag, err });
  }
}

/** 가격·재고·리뷰가 바뀐 상품의 상세 페이지와 목록 페이지를 갱신 */
export function revalidateProducts(productIds: Iterable<number>) {
  for (const productId of new Set(productIds)) {
    revalidate(CACHE_TAGS.product(productId));
  }
  revalidate(CACHE_TAGS.productList);
}

export function revalidateProductList() {
  revalidate(CACHE_TAGS.productList);
}

export function revalidateSiteBanner() {
  revalidate(CACHE_TAGS.siteBanner);
}

export function revalidateSitePopup() {
  revalidate(CACHE_TAGS.sitePopup);
}

const cachedClients = new Map<string, SupabaseClient>();

/**
 * 조회 결과를 태그와 함께 Next 데이터 캐시에 넣는 공개(anon) 클라이언트.
 * 서버 컴포넌트에서만 쓴다. 같은 태그 조합이면 클라이언트를 재사용한다.
 */
export function cachedSupabase(tags: string[]): SupabaseClient {
  const key = tags.join('|');
  const existing = cachedClients.get(key);
  if (existing) return existing;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const taggedFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, next: { revalidate: CACHE_REVALIDATE_SECONDS, tags } } as RequestInit);

  const client = url.startsWith('http')
    ? createClient(url, anonKey, { global: { fetch: taggedFetch } })
    : createClient('https://placeholder.supabase.co', 'placeholder');

  cachedClients.set(key, client);
  return client;
}
