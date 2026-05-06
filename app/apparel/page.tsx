import { supabase } from '@/lib/supabase';
import ApparelClient from './ApparelClient';

async function getPrices() {
  const { data } = await supabase
    .from('products')
    .select('id, name, price, original_price, coming_soon');

  const map: Record<number, { name?: string; price: number; original_price: number | null; coming_soon: boolean }> = {};
  for (const item of data || []) {
    map[item.id] = { name: item.name, price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false };
  }
  return map;
}

export default async function ApparelPage() {
  const prices = await getPrices();
  return <ApparelClient initialPrices={prices} />;
}
