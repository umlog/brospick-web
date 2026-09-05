'use client';

import { useState, useEffect } from 'react';
import { bootskinProductList } from '../../lib/products';
import ProductGrid, { DbPrice } from '../components/ProductGrid';
import { SORT_LABELS, SORT_MODES, SortMode, sortProducts } from '../components/productSort';
import apparelStyles from '../apparel/apparel-page.module.css';

const SCROLL_KEY = 'bootskin-scroll';
const SORT_KEY = 'bootskin-sort';

interface Props {
  initialPrices: Record<number, DbPrice>;
}

/** 부츠스킨 상품 목록 — 정렬 컨트롤과 그리드만 담당한다 (히어로·안내는 page.tsx) */
export default function BootskinClient({ initialPrices }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [dbPrices] = useState<Record<number, DbPrice>>(initialPrices);

  useEffect(() => {
    const savedSort = sessionStorage.getItem(SORT_KEY) as SortMode | null;
    if (savedSort && savedSort in SORT_LABELS) setSortMode(savedSort);

    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
      sessionStorage.removeItem(SCROLL_KEY);
      requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll, 10)));
    }
  }, []);

  const sorted = sortProducts(bootskinProductList, dbPrices, sortMode);

  return (
    <>
      <div className={`${apparelStyles.filterBar} ${apparelStyles.filterBarEnd}`}>
        <div className={apparelStyles.sortControls}>
          {SORT_MODES.map((mode) => (
            <button
              key={mode}
              className={`${apparelStyles.sortButton} ${sortMode === mode ? apparelStyles.sortButtonActive : ''}`}
              onClick={() => { setSortMode(mode); sessionStorage.setItem(SORT_KEY, mode); }}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <ProductGrid products={sorted} dbPrices={dbPrices} scrollKey={SCROLL_KEY} />
    </>
  );
}
