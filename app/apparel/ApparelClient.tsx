'use client';

import { useState, useEffect, useRef } from 'react';
import {
  apparelProductList,
  BOOTSKIN_CATEGORY,
  PRODUCT_FALLBACK_IMAGE,
  CATEGORY_LABELS,
  ProductCategory,
} from '../../lib/products';
import ProductImage from '../components/ProductImage';
import ProductGrid, { DbPrice } from '../components/ProductGrid';
import { SORT_LABELS, SORT_MODES, SortMode, sortProducts } from '../components/productSort';
import styles from './apparel-page.module.css';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

const SCROLL_KEY = 'apparel-scroll';

const CATEGORY_REPRESENTATIVE_IMAGE: Partial<Record<ProductCategory, string>> = {
  'training-top': '/brandstroy/sportswear-trainingtop-thumb.png',
  'top': '/apparel/top/cool-tech-t-shirt-black/1.png',
  'bottom': '/apparel/bottom/tech-training-shorts-gray/1.png',
  'socks': '/apparel/socks/athletic-long-socks-white/1.png',
  'set': '/apparel/set/heavy-essential-set/1.png',
};

function getRepresentativeImage(category: ProductCategory): string {
  if (CATEGORY_REPRESENTATIVE_IMAGE[category]) return CATEGORY_REPRESENTATIVE_IMAGE[category]!;
  const product = apparelProductList.find((p) => p.category === category);
  return product?.image ?? PRODUCT_FALLBACK_IMAGE;
}

interface Props {
  initialPrices: Record<number, DbPrice>;
}

export default function ApparelClient({ initialPrices }: Props) {
  const [activeCategory, setActiveCategory] = useState<Filter>(ALL);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [dbPrices] = useState<Record<number, DbPrice>>(initialPrices);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCategory = sessionStorage.getItem('apparel-category') as Filter | null;
    const savedSort = sessionStorage.getItem('apparel-sort') as SortMode | null;
    // 삭제·이동된 카테고리가 저장돼 있으면 빈 그리드가 되므로 유효성 확인 후 복원
    if (savedCategory && savedCategory !== BOOTSKIN_CATEGORY && (savedCategory === ALL || savedCategory in CATEGORY_LABELS)) {
      setActiveCategory(savedCategory);
    }
    if (savedSort && savedSort in SORT_LABELS) setSortMode(savedSort);

    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
      sessionStorage.removeItem(SCROLL_KEY);
      requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll, 10)));
    }
  }, []);

  const productCategories = new Set(apparelProductList.map((p) => p.category));
  const usedCategories = (Object.keys(CATEGORY_LABELS) as ProductCategory[]).filter((cat) => productCategories.has(cat));

  const baseList = activeCategory === ALL
    ? apparelProductList
    : apparelProductList.filter((p) => p.category === activeCategory);

  const filtered = sortProducts(baseList, dbPrices, sortMode);

  const changeCategory = (cat: Filter) => {
    setActiveCategory(cat);
    sessionStorage.setItem('apparel-category', cat);
  };

  const selectCategory = (cat: Filter) => {
    changeCategory(cat);
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <main className={styles.main}>
      {/* ===== 카테고리 카드 섹션 ===== */}
      <section className={styles.categorySection}>
        <div className={styles.categorySectionInner}>
          <div className={styles.categoryHeader}>
            <p className={styles.eyebrow}>COLLECTION</p>
            <h1 className={styles.categoryTitle}>브로스픽 의류</h1>
          </div>

          <div className={styles.categoryCards}>
            {usedCategories.map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryCard} ${activeCategory === cat ? styles.categoryCardActive : ''}`}
                onClick={() => selectCategory(cat)}
              >
                <div className={styles.categoryCardImage}>
                  <ProductImage
                    src={getRepresentativeImage(cat)}
                    alt={CATEGORY_LABELS[cat]}
                    sizes="(max-width: 768px) 45vw, 220px"
                  />
                </div>
                <span className={styles.categoryCardLabel}>{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ===== 상품 그리드 섹션 ===== */}
      <section className={styles.productSection} ref={gridRef}>
        <div className={styles.container}>
          {/* 필터 바 */}
          <div className={styles.filterBar}>
            <div className={styles.categories}>
              <button
                className={`${styles.categoryButton} ${activeCategory === ALL ? styles.active : ''}`}
                onClick={() => changeCategory(ALL)}
              >
                전체
              </button>
              {usedCategories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryButton} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => changeCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className={styles.sortControls}>
              {SORT_MODES.map((mode) => (
                <button
                  key={mode}
                  className={`${styles.sortButton} ${sortMode === mode ? styles.sortButtonActive : ''}`}
                  onClick={() => { setSortMode(mode); sessionStorage.setItem('apparel-sort', mode); }}
                >
                  {SORT_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          <ProductGrid products={filtered} dbPrices={dbPrices} scrollKey={SCROLL_KEY} />
        </div>
      </section>
    </main>
  );
}
