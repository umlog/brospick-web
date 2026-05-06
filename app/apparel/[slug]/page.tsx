import { supabase } from '@/lib/supabase';
import { products, type ProductSlug } from '../../../lib/products';
import ProductDetailClient from './ProductDetailClient';

async function getProductData(productId: number) {
  const [priceRes, sizesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, original_price, coming_soon')
      .eq('id', productId)
      .single(),
    supabase
      .from('product_sizes')
      .select('product_id, size, status, stock, delay_text')
      .eq('product_id', productId),
  ]);

  return {
    price: priceRes.data ?? null,
    sizes: sizesRes.data ?? [],
    comingSoon: priceRes.data?.coming_soon ?? null,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products[params.slug as ProductSlug];

  if (!product) {
    return <ProductDetailClient params={params} initialPrice={null} initialSizes={[]} />;
  }

  const { price, sizes, comingSoon } = await getProductData(product.id);
  return <ProductDetailClient params={params} initialPrice={price} initialSizes={sizes} dbComingSoon={comingSoon} />;
}
