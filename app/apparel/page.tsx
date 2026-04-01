'use client';

import { useState } from 'react';
import Link from 'next/link';
import { productList, getDiscountPercent, PRODUCT_FALLBACK_IMAGE, CATEGORY_LABELS, ProductCategory } from '../../lib/products';
import styles from './apparel-page.module.css';

const ALL = 'all';

export default function ApparelPage() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | typeof ALL>(ALL);

  const usedCategories = [...new Set(productList.map((p) => p.category))];

  const filtered = activeCategory === ALL
    ? productList
    : productList.filter((p) => p.category === activeCategory);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>브로스픽 의류</h1>
          <p className={styles.subtitle}>
            컬렉션<br />COLLECTION
          </p>
        </div>

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

        <div className={styles.productsGrid}>
          {filtered.map((product) =>
            product.comingSoon ? (
              <div key={product.id} className={styles.comingSoonCard}>
                <div className={styles.imageWrapper}>
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                    }}
                  />
                  <div className={styles.comingSoonOverlay}>
                    <span className={styles.comingSoonBadge}>COMING SOON</span>
                  </div>
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
                  <span className={styles.comingSoonText}>출시 예정</span>
                </div>
              </div>
            ) : (
              <Link key={product.id} href={`/apparel/${product.slug}`} className={styles.productCard}>
                <div className={styles.productImage}>
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
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
            )
          )}
        </div>
      </div>
    </main>
  );
}
