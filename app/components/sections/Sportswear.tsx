'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';
import { productList } from '@/lib/products';

export default function Sportswear() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Sportswear</h2>

        <div className={styles.cards}>
          {productList.map((product) => (
            <div key={product.id} className={styles.card}>
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
      </div>
    </section>
  );
}
