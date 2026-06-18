export const revalidate = 300;

import { supabase } from '@/lib/supabase';
import { reviewService } from '@/lib/services/review.service';
import { products, type ProductSlug } from '../../../lib/products';
import ProductDetailClient from './ProductDetailClient';

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

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products[params.slug as ProductSlug];

  if (!product) {
    return <ProductDetailClient params={params} initialPrice={null} initialSizes={[]} initialReviews={[]} initialAvgRating={0} initialReviewCount={0} />;
  }

  const { price, sizes, comingSoon, reviews, avgRating, reviewCount } = await getProductData(product.id);
  const effectiveComingSoon = process.env.NODE_ENV === 'development'
    ? (product.comingSoon ?? comingSoon)
    : comingSoon;
  return (
    <ProductDetailClient
      params={params}
      initialPrice={price}
      initialSizes={sizes}
      dbComingSoon={effectiveComingSoon}
      initialReviews={reviews}
      initialAvgRating={avgRating}
      initialReviewCount={reviewCount}
    />
  );
}
