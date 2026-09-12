export const revalidate = 300;

import type { Metadata } from 'next';
import Identity from '../components/sections/Identity';
import Blog from '../components/sections/Blog';
import BootskinPromo from '../components/sections/BootskinPromo';
import EbookPromo from '../components/sections/EbookPromo';
import Sportswear from '../components/sections/Sportswear';
import BrandStory from '../components/sections/BrandStory';
import ScrollHint from '../components/ScrollHint';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: '브로스픽 이야기 | 브로스픽 BROSPICK',
  description:
    '스포츠인들의 스토리를 기록하는 브로스픽입니다. 상품과 선수 인터뷰, 브랜드가 걸어온 이야기를 한곳에서 만나보세요.',
};

async function getPrices(): Promise<Record<number, { price: number; original_price: number | null; coming_soon: boolean; launched_at: string | null; sort_order: number | null }>> {
  const { data } = await supabase.from('products').select('id, price, original_price, coming_soon, launched_at, sort_order');
  const map: Record<number, { price: number; original_price: number | null; coming_soon: boolean; launched_at: string | null; sort_order: number | null }> = {};
  for (const item of data || []) {
    map[item.id] = { price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false, launched_at: item.launched_at ?? null, sort_order: item.sort_order ?? null };
  }
  return map;
}

export default async function StoryPage() {
  const prices = await getPrices();

  return (
    <>
      <ScrollHint />
      <Sportswear initialPrices={prices} />
      <BootskinPromo prices={prices} />
      <BrandStory />
      <EbookPromo />
      <Blog />
      <Identity />
    </>
  );
}
