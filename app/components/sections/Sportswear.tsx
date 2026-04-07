'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';
import { productList } from '@/lib/products';

const SLIDE_INTERVAL = 6000;

export default function Sportswear() {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
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

  const next = useCallback(() => setCurrent((c) => (c + 1) % productList.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + productList.length) % productList.length), []);

  useEffect(() => {
    const timer = setInterval(() => { if (!pausedRef.current) next(); }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pausedRef.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
    pausedRef.current = false;
  };

  const total = productList.length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      className={styles.section}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={styles.track}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {productList.map((product, idx) => {
          const dbPrice = dbPrices[product.id];
          const price = dbPrice?.price;
          const originalPrice = dbPrice?.original_price ?? null;
          const isActive = idx === current;

          return (
            <div key={product.id} className={`${styles.slide} ${isActive ? styles.active : ''}`}>
              {product.comingSoon ? (
                <div className={styles.comingSoonImageContainer}>
                  <Image src={product.image} alt={product.name} fill className={styles.image} style={{ objectFit: 'cover' }} priority={idx === 0} />
                  <span className={styles.comingSoonBadge}>COMING SOON</span>
                </div>
              ) : (
                <Link href={`/apparel/${product.slug}`} className={styles.imageContainer}>
                  <Image src={product.image} alt={product.name} fill className={styles.image} style={{ objectFit: 'cover' }} priority={idx === 0} />
                </Link>
              )}

              <div className={styles.info}>
                <p className={styles.label}>BROSPICK COLLECTION</p>
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.description}>{product.description}</p>
                )}
                {price !== undefined && (
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₩{price.toLocaleString()}</span>
                    {originalPrice && (
                      <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                )}
                {product.comingSoon ? (
                  <span className={styles.comingSoonLabel}>출시 예정</span>
                ) : (
                  <Link href={`/apparel/${product.slug}`} className={styles.cta}>
                    구매하기
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div className={styles.nav}>
        <button className={styles.arrowBtn} onClick={prev} aria-label="이전">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.counter}>
          <span>{pad(current + 1)}</span> / {pad(total)}
        </span>
        <button className={styles.arrowBtn} onClick={next} aria-label="다음">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 진행 바 */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </section>
  );
}
