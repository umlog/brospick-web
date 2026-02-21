'use client';

import Link from 'next/link';
import { productList, getDiscountPercent } from '../../lib/products';
import { SHIPPING } from '../../lib/constants';
import styles from './apparel-page.module.css';

export default function ApparelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>브로스픽 의류</h1>
          <p className={styles.subtitle}>
            선수와 팬이 함께 입는 브로스픽 의류
          </p>
        </div>

        <div className={styles.productsGrid}>
          {productList.map((product) => (
            <Link key={product.id} href={`/apparel/${product.id}`} className={styles.productCard}>
              <div className={styles.productImage}>
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = '/apparel/brospick-sportswear-1.png';
                  }}
                />
              </div>
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>₩{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <>
                      <span className={styles.originalPrice}>
                        ₩{product.originalPrice.toLocaleString()}
                      </span>
                      <span className={styles.discountBadge}>
                        {getDiscountPercent(product.price, product.originalPrice)}%
                      </span>
                    </>
                  )}
                </div>
                <span className={styles.viewDetail}>자세히 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
