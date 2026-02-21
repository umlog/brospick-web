'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';
import { products } from '@/lib/products';

const product = products['1'];
const carouselImages = ['/apparel/bp-thumb.png', '/apparel/bp-thumb2.png'];

export default function Sportswear() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Sportswear</h2>

        <div className={styles.card}>
          <Link href={`/apparel/${product.id}`} className={styles.imageContainer}>
            {carouselImages.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={product.name}
                fill
                className={`${styles.image} ${i === activeIndex ? styles.imageActive : styles.imageHidden}`}
                style={{ objectFit: 'cover' }}
                priority={i === 0}
              />
            ))}
            <div className={styles.badge}>NOW AVAILABLE</div>
          </Link>

          <div className={styles.info}>
            <p className={styles.label}>BROSPICK COLLECTION</p>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.description}>
              선수와 팬이 함께 입는 브로스픽의 첫 번째 컬렉션.
              편안한 착용감과 스타일을 겸비한 하프집 트레이닝 탑.
            </p>
            <div className={styles.priceRow}>
              <span className={styles.price}>₩{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>₩{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <Link href={`/apparel/${product.id}`} className={styles.shopLink}>
              구매하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
