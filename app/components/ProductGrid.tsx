'use client';

import Link from 'next/link';
import { productList, getDiscountPercent, getProductHref } from '../../lib/products';
import ProductImage from './ProductImage';
import styles from '../apparel/apparel-page.module.css';

type ListedProduct = (typeof productList)[number];

export interface DbPrice {
  name?: string;
  price: number;
  original_price: number | null;
  coming_soon: boolean;
  sort_order: number | null;
}

interface Props {
  products: ListedProduct[];
  dbPrices: Record<number, DbPrice>;
  /** 상세 페이지로 이동하기 전 스크롤 위치를 저장할 sessionStorage 키 */
  scrollKey: string;
}

export default function ProductGrid({ products, dbPrices, scrollKey }: Props) {
  return (
    <div className={styles.productsGrid}>
      {products.map((product) => {
        const dbPrice = dbPrices[product.id];
        const price = dbPrice?.price;
        const originalPrice = dbPrice?.original_price ?? null;
        const productName = dbPrice?.name ?? product.name;
        const isComingSoon = dbPrice ? dbPrice.coming_soon : product.comingSoon;

        const priceBlock = price !== undefined && (
          <>
            <span className={`${styles.price} ${originalPrice && originalPrice > price ? styles.priceSale : ''}`}>₩{price.toLocaleString()}</span>
            {originalPrice && originalPrice > price && (
              <>
                <span className={styles.originalPrice}>₩{originalPrice.toLocaleString()}</span>
                <span className={styles.discountBadge}>{getDiscountPercent(price, originalPrice)}%</span>
              </>
            )}
          </>
        );

        return isComingSoon ? (
          <div key={product.id} className={styles.comingSoonCard}>
            <div className={styles.imageWrapper}>
              <ProductImage
                src={product.image}
                alt={product.name}
                sizes="(max-width: 768px) 50vw, 280px"
              />
              <div className={styles.comingSoonOverlay}>
                <span className={styles.comingSoonBadge}>COMING SOON</span>
              </div>
              {product.popularBadge && (
                <span className={styles.popularBadge}>{product.popularBadge}</span>
              )}
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{productName}</h3>
              <div className={styles.priceContainer}>{priceBlock}</div>
              <span className={styles.comingSoonText}>출시 예정</span>
            </div>
          </div>
        ) : (
          <Link
            key={product.id}
            href={getProductHref(product)}
            className={styles.productCard}
            onClick={() => sessionStorage.setItem(scrollKey, String(window.scrollY))}
          >
            <div className={`${styles.productImage} ${product.imageZoom ? styles.productImageZoom : ''}`}>
              <ProductImage
                src={product.image}
                alt={product.name}
                sizes="(max-width: 768px) 50vw, 280px"
              />
              {product.popularBadge && (
                <span className={styles.popularBadge}>{product.popularBadge}</span>
              )}
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{productName}</h3>
              <div className={styles.priceContainer}>{priceBlock}</div>
              <span className={styles.viewDetail}>자세히 보기 →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
