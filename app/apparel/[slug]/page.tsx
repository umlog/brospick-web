// 가격·재고·리뷰가 바뀌면 상품 태그로 즉시 갱신된다. 이 값은 안전장치 (lib/cache.ts)
export const revalidate = 3600;

import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { products, BOOTSKIN_CATEGORY, getProductHref, type ProductSlug } from '../../../lib/products';
import ProductDetailPage, { buildProductMetadata } from '../../components/ProductDetailPage';

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return buildProductMetadata(params.slug);
}

export async function generateStaticParams() {
  // 부츠스킨은 /bootskin/[slug]에서 렌더링된다 (여기로 들어오면 301 리다이렉트)
  return Object.values(products)
    .filter((product) => product.category !== BOOTSKIN_CATEGORY)
    .map((product) => ({ slug: product.slug }));
}

export default async function ApparelProductDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const product = products[params.slug as ProductSlug];

  // 부츠스킨 분리 이전의 옛 주소 — 새 주소로 영구 이동
  if (product?.category === BOOTSKIN_CATEGORY) {
    permanentRedirect(getProductHref(product));
  }

  return <ProductDetailPage slug={params.slug} />;
}
