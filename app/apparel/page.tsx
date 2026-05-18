import { supabase } from '@/lib/supabase';
import { productList } from '@/lib/products';
import ApparelClient from './ApparelClient';

async function getPrices() {
  const { data } = await supabase
    .from('products')
    .select('id, name, price, original_price, coming_soon, sort_order');

  const map: Record<number, { name?: string; price: number; original_price: number | null; coming_soon: boolean; sort_order: number | null }> = {};
  for (const item of data || []) {
    map[item.id] = { name: item.name, price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false, sort_order: item.sort_order ?? null };
  }
  return map;
}

export default async function ApparelPage() {
  const prices = await getPrices();

  if (process.env.NODE_ENV === 'development') {
    for (const product of productList) {
      if (prices[product.id] !== undefined && product.comingSoon !== undefined) {
        prices[product.id].coming_soon = product.comingSoon;
      }
    }
  }

  return <ApparelClient initialPrices={prices} />;
}
