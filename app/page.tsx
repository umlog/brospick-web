export const dynamic = 'force-dynamic';

import Hero from './components/sections/Hero';
import Manifesto from './components/sections/Manifesto';
import Project from './components/sections/Project';
import Blog from './components/sections/Blog';
import Future from './components/sections/Future';
// import PickerApp from './components/sections/PickerApp';
import Sportswear from './components/sections/Sportswear';
import BrandStory from './components/sections/BrandStory';
// import Contact from './components/sections/Contact';
import { supabaseAdmin } from '@/lib/supabase';

async function getPrices(): Promise<Record<number, { price: number; original_price: number | null; coming_soon: boolean }>> {
  const { data } = await supabaseAdmin.from('products').select('id, price, original_price, coming_soon');
  const map: Record<number, { price: number; original_price: number | null; coming_soon: boolean }> = {};
  for (const item of data || []) {
    map[item.id] = { price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false };
  }
  return map;
}

export default async function Home() {
  const prices = await getPrices();

  return (
    <>
      <Hero />
      <Sportswear initialPrices={prices} />
      <BrandStory />
      <Blog />
      <Manifesto />
      <Project />
      <Future />
      {/* <PickerApp /> */}
      {/* <Contact /> */}
    </>
  );
}
