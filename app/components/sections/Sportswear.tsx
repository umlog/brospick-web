'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './sportswear.module.css';
import { productList, getDiscountPercent, CATEGORY_LABELS, ProductCategory, PRODUCT_FALLBACK_IMAGE } from '@/lib/products';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

interface Props {
  initialPrices: Record<number, { price: number; original_price: number | null }>;
}

export default function Sportswear({ initialPrices }: Props) {
  const [active, setActive] = useState<Filter>(ALL);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dbPrices = initialPrices;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows]);

  // 카테고리 바뀔 때 화살표 상태 재계산
  useEffect(() => {
    setTimeout(updateArrows, 50);
  }, [active, updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const usedCategories = [...new Set(productList.map((p) => p.category))] as ProductCategory[];
  const filtered = active === ALL ? productList : productList.filter((p) => p.category === active);

  const changeCategory = (cat: Filter) => {
    setActive(cat);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* 타이틀 */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>COLLECTION</p>
          <h2 className={styles.title}>브로스픽 의류</h2>
        </div>

        {/* 카테고리 탭 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${active === ALL ? styles.tabActive : ''}`}
            onClick={() => changeCategory(ALL)}
          >
            전체
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat}
              className={`${styles.tab} ${active === cat ? styles.tabActive : ''}`}
              onClick={() => changeCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 가로 스크롤 카드 */}
        <div className={styles.sliderWrapper}>
          <button
            className={`${styles.arrowBtn} ${styles.arrowLeft} ${!canScrollLeft ? styles.arrowHidden : ''}`}
            onClick={() => scroll('left')}
            aria-label="이전"
          >
            ‹
          </button>
          <button
            className={`${styles.arrowBtn} ${styles.arrowRight} ${!canScrollRight ? styles.arrowHidden : ''}`}
            onClick={() => scroll('right')}
            aria-label="다음"
          >
            ›
          </button>
        <div className={styles.scrollTrack} ref={scrollRef}>
          {filtered.map((product) => {
            const dbPrice = dbPrices[product.id];
            const price = dbPrice?.price;
            const originalPrice = dbPrice?.original_price ?? null;

            if (product.comingSoon) {
              return (
                <div key={product.id} className={styles.card}>
                  <div className={styles.imageWrap}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={styles.cardImg}
                      onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
                    />
                    <div className={styles.comingSoonOverlay}>
                      <span className={styles.comingSoonBadge}>COMING SOON</span>
                    </div>
                  </div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardName}>{product.name}</p>
                    {price !== undefined && (
                      <div className={styles.priceRow}>
                        <span className={styles.price}>₩{price.toLocaleString()}</span>
                        {originalPrice && (
                          <>
                            <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                            <span className={styles.discountBadge}>{getDiscountPercent(price, originalPrice)}%</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link key={product.id} href={`/apparel/${product.slug}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.cardImg}
                    onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <p className={styles.cardName}>{product.name}</p>
                  {price !== undefined && (
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₩{price.toLocaleString()}</span>
                      {originalPrice && (
                        <>
                          <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                          <span className={styles.discountBadge}>{getDiscountPercent(price, originalPrice)}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        </div>

        {/* 전체 보기 */}
        <div className={styles.cta}>
          <Link href="/apparel" className={styles.ctaBtn}>
            모두 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
