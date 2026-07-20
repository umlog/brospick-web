export const revalidate = 300;

import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { reviewService } from '@/lib/services/review.service';
import { SITE_URL } from '@/lib/constants';
import { products, type ProductSlug } from '../../../lib/products';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const product = products[params.slug as ProductSlug];
  if (!product) return { title: '브로스픽 BROSPICK' };
  return {
    title: `${product.name} | 브로스픽 BROSPICK`,
    description: product.tagline,
    openGraph: {
      title: `${product.name} | 브로스픽 BROSPICK`,
      description: product.tagline,
      images: [{ url: product.image }],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ slug }));
}

async function getProductData(productId: number) {
  const [priceRes, sizesRes, reviewsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, original_price, coming_soon')
      .eq('id', productId)
      .single(),
    supabase
      .from('product_sizes')
      .select('product_id, size, status, stock, delay_text')
      .eq('product_id', productId),
    reviewService.getProductReviews(productId).catch(() => ({ reviews: [], avgRating: 0, count: 0 })),
  ]);

  return {
    price: priceRes.data ?? null,
    sizes: sizesRes.data ?? [],
    comingSoon: priceRes.data?.coming_soon ?? null,
    reviews: reviewsRes.reviews,
    avgRating: reviewsRes.avgRating,
    reviewCount: reviewsRes.count,
  };
}

export default async function ProductDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const product = products[params.slug as ProductSlug];

  if (!product) {
    return <ProductDetailClient params={params} initialPrice={null} initialSizes={[]} initialReviews={[]} initialAvgRating={0} initialReviewCount={0} />;
  }

  const { price, sizes, comingSoon, reviews, avgRating, reviewCount } = await getProductData(product.id);
  const effectiveComingSoon = process.env.NODE_ENV === 'development'
    ? (product.comingSoon ?? comingSoon)
    : comingSoon;

  // 구조화 데이터 (구글 리치 결과 — 상품 가격·별점 노출)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: price?.name ?? product.name,
    description: product.tagline,
    image: `${SITE_URL}${product.image}`,
    sku: String(product.id),
    brand: { '@type': 'Brand', name: 'BROSPICK' },
    ...(price && {
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/apparel/${params.slug}`,
        priceCurrency: 'KRW',
        price: price.price,
        availability: effectiveComingSoon
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock',
      },
    }),
    ...(reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetailClient
        params={params}
        initialPrice={price}
        initialSizes={sizes}
        dbComingSoon={effectiveComingSoon}
        initialReviews={reviews}
        initialAvgRating={avgRating}
        initialReviewCount={reviewCount}
      />
    </>
  );
}
