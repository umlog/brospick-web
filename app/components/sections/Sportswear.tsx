'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';
import { productList } from '@/lib/products';

const SLIDE_INTERVAL = 7000;

export default function Sportswear() {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % productList.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!pausedRef.current) next();
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Sportswear</h2>

        <div
          className={styles.carousel}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          <div
            className={styles.track}
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {productList.map((product) => (
              <div key={product.id} className={styles.slide}>
                {product.comingSoon ? (
                  <div className={styles.comingSoonImageContainer}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={styles.image}
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                    <span className={styles.comingSoonBadge}>COMING SOON</span>
                  </div>
                ) : (
                  <Link href={`/apparel/${product.slug}`} className={styles.imageContainer}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={styles.image}
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                    <div className={styles.badge}>NOW AVAILABLE</div>
                  </Link>
                )}

                <div className={styles.info}>
                  <p className={styles.label}>BROSPICK COLLECTION</p>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.description}>{product.description}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₩{product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className={styles.originalPrice}>
                        ₩{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.comingSoon ? (
                    <span className={styles.comingSoonLabel}>출시 예정</span>
                  ) : (
                    <Link href={`/apparel/${product.slug}`} className={styles.shopLink}>
                      구매하기
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 도트 네비게이션 */}
          <div className={styles.dots}>
            {productList.map((_, i) => (
              <button
                key={i}
                className={i === current ? `${styles.dot} ${styles.dotActive}` : styles.dot}
                onClick={() => setCurrent(i)}
                aria-label={`슬라이드 ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
