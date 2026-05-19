export const dynamic = 'force-dynamic';

import Manifesto from './components/sections/Manifesto';
import Project from './components/sections/Project';
import Blog from './components/sections/Blog';
import EbookPromo from './components/sections/EbookPromo';
import Future from './components/sections/Future';
// import PickerApp from './components/sections/PickerApp';
import Sportswear from './components/sections/Sportswear';
import BrandStory from './components/sections/BrandStory';
// import Contact from './components/sections/Contact';
import ScrollHint from './components/ScrollHint';
import { supabaseAdmin } from '@/lib/supabase';

async function getPrices(): Promise<Record<number, { price: number; original_price: number | null; coming_soon: boolean; launched_at: string | null; sort_order: number | null }>> {
  const { data } = await supabaseAdmin.from('products').select('id, price, original_price, coming_soon, launched_at, sort_order');
  const map: Record<number, { price: number; original_price: number | null; coming_soon: boolean; launched_at: string | null; sort_order: number | null }> = {};
  for (const item of data || []) {
    map[item.id] = { price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false, launched_at: item.launched_at ?? null, sort_order: item.sort_order ?? null };
  }
  return map;
}

export default async function Home() {
  const prices = await getPrices();

  return (
    <>
      <ScrollHint />
      <Sportswear initialPrices={prices} />
      <BrandStory />
      <EbookPromo />
      <Blog />
      <Manifesto />
      <Project />
      <Future />
      {/* <PickerApp /> */}
      {/* <Contact /> */}
    </>
  );
}
