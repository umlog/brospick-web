'use client';

import Link from 'next/link';
import styles from './apparel-page.module.css';

export default function ApparelPage() {
  // 반집업 체육복만 표시
  const products = [
    {
      id: 1,
      name: 'Half-Zip Training Top',
      price: 29900,
      originalPrice: 69000,
      image: '/apparel/brospick-sportswear-1.png',
      description: '편안한 착용감과 스타일을 겸비한 Half-Zip Training Top',
    },
  ];

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
          {products.map((product) => (
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
                        {Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <span className={styles.shippingInfo}>배송비 포함</span>
                <span className={styles.viewDetail}>자세히 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
