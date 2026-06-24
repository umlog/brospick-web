'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { productList, getDiscountPercent, PRODUCT_FALLBACK_IMAGE, CATEGORY_LABELS, ProductCategory } from '../../lib/products';
import ProductImage from '../components/ProductImage';
import styles from './apparel-page.module.css';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

const CATEGORY_REPRESENTATIVE_IMAGE: Partial<Record<ProductCategory, string>> = {
  'training-top': '/brandstroy/sportswear-trainingtop-thumb.png',
  'top': '/apparel/top/cool-tech-t-shirt-black/1.png',
  'bottom': '/apparel/bottom/tech-training-shorts-gray/1.png',
  'socks': '/apparel/socks/athletic-long-socks-white/1.png',
  'set': '/apparel/set/heavy-essential-set/1.png',
};

function getRepresentativeImage(category: ProductCategory): string {
  if (CATEGORY_REPRESENTATIVE_IMAGE[category]) return CATEGORY_REPRESENTATIVE_IMAGE[category]!;
  const product = productList.find((p) => p.category === category);
  return product?.image ?? PRODUCT_FALLBACK_IMAGE;
}

type SortMode = 'recommended' | 'price_desc' | 'price_asc';

interface DbPrice {
  name?: string;
  price: number;
  original_price: number | null;
  coming_soon: boolean;
  sort_order: number | null;
}

interface Props {
  initialPrices: Record<number, DbPrice>;
}

const SORT_LABELS: Record<SortMode, string> = {
  recommended: '추천순',
  price_desc: '가격 높은순',
  price_asc: '가격 낮은순',
};

export default function ApparelClient({ initialPrices }: Props) {
  const [activeCategory, setActiveCategory] = useState<Filter>(ALL);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [dbPrices] = useState<Record<number, DbPrice>>(initialPrices);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCategory = sessionStorage.getItem('apparel-category') as Filter | null;
    const savedSort = sessionStorage.getItem('apparel-sort') as SortMode | null;
    if (savedCategory) setActiveCategory(savedCategory);
    if (savedSort) setSortMode(savedSort);

    const savedScroll = sessionStorage.getItem('apparel-scroll');
    if (savedScroll) {
      sessionStorage.removeItem('apparel-scroll');
      requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll, 10)));
    }
  }, []);

  const productCategories = new Set(productList.map((p) => p.category));
  const usedCategories = (Object.keys(CATEGORY_LABELS) as ProductCategory[]).filter((cat) => productCategories.has(cat));

  const baseList = activeCategory === ALL
    ? productList
    : productList.filter((p) => p.category === activeCategory);

  const filtered = [...baseList].sort((a, b) => {
    const aDb = dbPrices[a.id];
    const bDb = dbPrices[b.id];
    const aSortOrder = aDb?.sort_order ?? null;
    const bSortOrder = bDb?.sort_order ?? null;
    const aComingSoon = aDb ? aDb.coming_soon : a.comingSoon;
    const bComingSoon = bDb ? bDb.coming_soon : b.comingSoon;
    const aPrice = aDb?.price ?? 0;
    const bPrice = bDb?.price ?? 0;

    // 커밍순 항상 마지막
    if (!aComingSoon && bComingSoon) return -1;
    if (aComingSoon && !bComingSoon) return 1;
    if (aComingSoon && bComingSoon) return 0;

    // 판매중끼리 정렬
    if (sortMode === 'recommended') {
      // BEST 배지 우선
      const aBest = a.popularBadge ? 1 : 0;
      const bBest = b.popularBadge ? 1 : 0;
      if (bBest !== aBest) return bBest - aBest;
      // 그 다음 sort_order 순
      if (aSortOrder !== null && bSortOrder !== null) return aSortOrder - bSortOrder;
      if (aSortOrder !== null) return -1;
      if (bSortOrder !== null) return 1;
      return bPrice - aPrice;
    }
    if (sortMode === 'price_desc') return bPrice - aPrice;
    if (sortMode === 'price_asc') return aPrice - bPrice;
    return 0;
  });

  const selectCategory = (cat: Filter) => {
    setActiveCategory(cat);
    sessionStorage.setItem('apparel-category', cat);
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
                onClick={() => { setActiveCategory(ALL); sessionStorage.setItem('apparel-category', ALL); }}
              >
                전체
              </button>
              {usedCategories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryButton} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className={styles.sortControls}>
              {(['recommended', 'price_desc', 'price_asc'] as SortMode[]).map((mode) => (
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

          {/* 상품 그리드 */}
          <div className={styles.productsGrid}>
            {filtered.map((product) => {
              const dbPrice = dbPrices[product.id];
              const price = dbPrice?.price;
              const originalPrice = dbPrice?.original_price ?? null;
              const productName = dbPrice?.name ?? product.name;

              const isComingSoon = dbPrice ? dbPrice.coming_soon : product.comingSoon;
              return isComingSoon ? (
                <div key={product.id} className={styles.comingSoonCard}>
                  <div className={styles.imageWrapper}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      sizes="(max-width: 768px) 50vw, 280px"
                    />
                    <div className={styles.comingSoonOverlay}>
                      <span className={styles.comingSoonBadge}>COMING SOON</span>
                    </div>
                    {product.popularBadge && (
                      <span className={styles.popularBadge}>{product.popularBadge}</span>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{productName}</h3>
                    <div className={styles.priceContainer}>
                      {price !== undefined && (
                        <>
                          <span className={styles.price}>₩{price.toLocaleString()}</span>
                          {originalPrice && originalPrice > price && (
                            <>
                              <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                              <span className={styles.discountBadge}>{getDiscountPercent(price, originalPrice)}%</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <span className={styles.comingSoonText}>출시 예정</span>
                  </div>
                </div>
              ) : (
                <Link key={product.id} href={`/apparel/${product.slug}`} className={styles.productCard} onClick={() => sessionStorage.setItem('apparel-scroll', String(window.scrollY))}>
                  <div className={`${styles.productImage} ${product.imageZoom ? styles.productImageZoom : ''}`}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      sizes="(max-width: 768px) 50vw, 280px"
                    />
                    {product.popularBadge && (
                      <span className={styles.popularBadge}>{product.popularBadge}</span>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{productName}</h3>
                    <div className={styles.priceContainer}>
                      {price !== undefined && (
                        <>
                          <span className={styles.price}>₩{price.toLocaleString()}</span>
                          {originalPrice && originalPrice > price && (
                            <>
                              <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                              <span className={styles.discountBadge}>{getDiscountPercent(price, originalPrice)}%</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <span className={styles.viewDetail}>자세히 보기 →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
