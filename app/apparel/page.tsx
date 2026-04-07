'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { productList, getDiscountPercent, PRODUCT_FALLBACK_IMAGE, CATEGORY_LABELS, ProductCategory } from '../../lib/products';
import styles from './apparel-page.module.css';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

// 카테고리별 대표 이미지 — 첫 번째 상품 이미지 사용
function getRepresentativeImage(category: ProductCategory): string {
  const product = productList.find((p) => p.category === category);
  return product?.image ?? PRODUCT_FALLBACK_IMAGE;
}

export default function ApparelPage() {
  const [activeCategory, setActiveCategory] = useState<Filter>(ALL);
  const [dbPrices, setDbPrices] = useState<Record<number, { price: number; original_price: number | null }>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/products/prices')
      .then((res) => res.json())
      .then((data) => {
        const map: Record<number, { price: number; original_price: number | null }> = {};
        for (const item of data.prices || []) {
          map[item.id] = { price: item.price, original_price: item.original_price };
        }
        setDbPrices(map);
      })
      .catch(() => {});
  }, []);

  const usedCategories = [...new Set(productList.map((p) => p.category))] as ProductCategory[];

  const filtered = activeCategory === ALL
    ? productList
    : productList.filter((p) => p.category === activeCategory);

  const selectCategory = (cat: Filter) => {
    setActiveCategory(cat);
    // 카테고리 선택 시 상품 그리드로 스크롤
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
                  <img
                    src={getRepresentativeImage(cat)}
                    alt={CATEGORY_LABELS[cat]}
                    onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
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
                onClick={() => setActiveCategory(ALL)}
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
            <span className={styles.productCount}>{filtered.length}개 상품</span>
          </div>

          {/* 상품 그리드 */}
          <div className={styles.productsGrid}>
            {filtered.map((product) => {
              const dbPrice = dbPrices[product.id];
              const price = dbPrice?.price;
              const originalPrice = dbPrice?.original_price ?? null;

              return product.comingSoon ? (
                <div key={product.id} className={styles.comingSoonCard}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
                    />
                    <div className={styles.comingSoonOverlay}>
                      <span className={styles.comingSoonBadge}>COMING SOON</span>
                    </div>
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.priceContainer}>
                      {price !== undefined && (
                        <>
                          <span className={styles.price}>₩{price.toLocaleString()}</span>
                          {originalPrice && (
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
                <Link key={product.id} href={`/apparel/${product.slug}`} className={styles.productCard}>
                  <div className={styles.productImage}>
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.priceContainer}>
                      {price !== undefined && (
                        <>
                          <span className={styles.price}>₩{price.toLocaleString()}</span>
                          {originalPrice && (
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
