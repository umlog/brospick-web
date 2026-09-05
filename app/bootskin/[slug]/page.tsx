export const revalidate = 300;

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
  return Object.values(products)
    .filter((product) => product.category === BOOTSKIN_CATEGORY)
    .map((product) => ({ slug: product.slug }));
}

export default async function BootskinProductDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const product = products[params.slug as ProductSlug];

  // 부츠스킨이 아닌 상품이 이 경로로 들어오면 의류 상세로 되돌린다
  if (product && product.category !== BOOTSKIN_CATEGORY) {
    permanentRedirect(getProductHref(product));
  }

  return <ProductDetailPage slug={params.slug} />;
}
