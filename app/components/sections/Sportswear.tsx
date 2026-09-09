'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './sportswear.module.css';
import ProductImage from '../ProductImage';
import { productList, getDiscountPercent, getProductHref, CATEGORY_LABELS, BOOTSKIN_CATEGORY, ProductCategory } from '@/lib/products';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

/**
 * '전체' 탭에 남기는 부츠스킨 대표 카드 수.
 *
 * 부츠스킨은 9종이라 전부 풀면 의류 카드가 가로 스크롤 뒤로 밀린다.
 * 정렬 상위 몇 개만 미끼로 두고 나머지는 부츠스킨 탭에서 본다.
 */
const BOOTSKIN_CARDS_IN_ALL = 2;

interface Props {
  initialPrices: Record<number, { price: number; original_price: number | null; coming_soon: boolean; launched_at: string | null; sort_order: number | null }>;
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

  const scrollToStart = useCallback(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, []);

  // 카테고리 바뀔 때 처음으로 되돌리고 화살표 상태 재계산.
  // 클릭 핸들러에서 바로 되돌리면 아직 이전 카드가 붙어 있어 애니메이션이 끊기므로
  // 새 목록이 그려진 다음 프레임에 실행한다.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollToStart();
      updateArrows();
    });
    return () => cancelAnimationFrame(id);
  }, [active, scrollToStart, updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: 'smooth' });
  };

  // 부츠스킨은 전용 섹션(BootskinPromo)과 별개로 이 목록에도 노출한다 — 주력 상품이라 진입점을 둘 다 둔다
  const productCategories = new Set(productList.map((p) => p.category));
  const orderedCategories = (Object.keys(CATEGORY_LABELS) as ProductCategory[]).filter((c) => productCategories.has(c));

  const sorted = [...productList].sort((a, b) => {
    const aDb = dbPrices[a.id];
    const bDb = dbPrices[b.id];
    const aSortOrder = aDb?.sort_order ?? null;
    const bSortOrder = bDb?.sort_order ?? null;
    if (aSortOrder !== null && bSortOrder !== null) return aSortOrder - bSortOrder;
    if (aSortOrder !== null) return -1;
    if (bSortOrder !== null) return 1;
    const aComingSoon = aDb ? aDb.coming_soon : a.comingSoon;
    const bComingSoon = bDb ? bDb.coming_soon : b.comingSoon;
    if (aComingSoon !== bComingSoon) return aComingSoon ? 1 : -1;
    const aDate = aDb?.launched_at ? new Date(aDb.launched_at).getTime() : -Infinity;
    const bDate = bDb?.launched_at ? new Date(bDb.launched_at).getTime() : -Infinity;
    if (bDate !== aDate) return bDate - aDate;
    return a.id - b.id;
  });

  const bootskinTop = sorted
    .filter((p) => p.category === BOOTSKIN_CATEGORY)
    .slice(0, BOOTSKIN_CARDS_IN_ALL);

  const filtered =
    active === ALL
      ? sorted.filter((p) => p.category !== BOOTSKIN_CATEGORY || bootskinTop.includes(p))
      : sorted.filter((p) => p.category === active);

  const changeCategory = (cat: Filter) => {
    setActive(cat);
    // 같은 탭을 다시 눌렀을 때는 리렌더가 없어 위 effect가 돌지 않는다
    scrollToStart();
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* 타이틀 */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>COLLECTION</p>
          <h2 className={styles.title}>브로스픽 상품</h2>
        </div>

        {/* 카테고리 탭 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${active === ALL ? styles.tabActive : ''}`}
            onClick={() => changeCategory(ALL)}
          >
            전체
          </button>
          {orderedCategories.map((cat) => (
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
            const isComingSoon = dbPrice ? dbPrice.coming_soon : product.comingSoon;

            if (isComingSoon) {
              return (
                <div key={product.id} className={styles.card}>
                  <div className={styles.imageWrap}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className={styles.cardImg}
                      sizes="(max-width: 768px) 60vw, 300px"
                    />
                    <div className={styles.comingSoonOverlay}>
                      <span className={styles.comingSoonBadge}>COMING SOON</span>
                    </div>
                    {product.popularBadge && (
                      <span className={styles.popularBadge}>{product.popularBadge}</span>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardName}>{product.name}</p>
                    {price !== undefined && (
                      <div className={styles.priceRow}>
                        <span className={`${styles.price} ${originalPrice && originalPrice > price ? styles.priceSale : ''}`}>₩{price.toLocaleString()}</span>
                        {originalPrice && originalPrice > price && (
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
              <Link key={product.id} href={getProductHref(product)} className={styles.card}>
                <div className={styles.imageWrap}>
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className={styles.cardImg}
                    sizes="(max-width: 768px) 60vw, 300px"
                  />
                  {product.popularBadge && (
                    <span className={styles.popularBadge}>{product.popularBadge}</span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <p className={styles.cardName}>{product.name}</p>
                  {price !== undefined && (
                    <div className={styles.priceRow}>
                      <span className={`${styles.price} ${originalPrice && originalPrice > price ? styles.priceSale : ''}`}>₩{price.toLocaleString()}</span>
                      {originalPrice && originalPrice > price && (
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
        {/* 부츠스킨은 /apparel 목록에서 제외돼 있으므로 전용 컬렉션으로 보낸다 */}
        <div className={styles.cta}>
          <Link
            href={active === BOOTSKIN_CATEGORY ? '/bootskin' : '/apparel'}
            className={styles.ctaBtn}
          >
            {active === BOOTSKIN_CATEGORY ? '부츠스킨 모두 보기' : '모두 보기'}
          </Link>
        </div>
      </div>
    </section>
  );
}
