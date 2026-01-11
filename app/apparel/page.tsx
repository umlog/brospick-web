'use client';

import Link from 'next/link';
import styles from './apparel-page.module.css';

export default function ApparelPage() {
  // 반집업 체육복만 표시
  const products = [
    {
      id: 1,
      name: '브로스픽 반집업 체육복',
      price: 69000,
      originalPrice: 79000,
      image: '/placeholder-apparel.jpg', // 임시 이미지 경로
      description: '편안한 착용감과 스타일을 겸비한 브로스픽 반집업 체육복',
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
                      // 이미지 로드 실패 시 플레이스홀더 표시
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); display: flex; align-items: center; justify-content: center; font-size: 48px;">👕</div>';
                    }}
                  />
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>₩{product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className={styles.originalPrice}>
                        ₩{product.originalPrice.toLocaleString()}
                      </span>
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
