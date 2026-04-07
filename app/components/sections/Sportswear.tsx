'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';
import { productList, getDiscountPercent, CATEGORY_LABELS, ProductCategory, PRODUCT_FALLBACK_IMAGE } from '@/lib/products';

const ALL = 'all' as const;
type Filter = ProductCategory | typeof ALL;

export default function Sportswear() {
  const [active, setActive] = useState<Filter>(ALL);
  const [dbPrices, setDbPrices] = useState<Record<number, { price: number; original_price: number | null }>>({});

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
  const filtered = active === ALL ? productList : productList.filter((p) => p.category === active);

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
            onClick={() => setActive(ALL)}
          >
            전체
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat}
              className={`${styles.tab} ${active === cat ? styles.tabActive : ''}`}
              onClick={() => setActive(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 가로 스크롤 카드 */}
        <div className={styles.scrollTrack}>
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
