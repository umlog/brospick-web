'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import styles from './product-detail.module.css';

// 실제로는 데이터베이스나 API에서 가져올 데이터
const products: Record<string, {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  sizes: string[];
  details: string[];
}> = {
  '1': {
    id: 1,
    name: 'BROSPICK Half-Zip Training Top',
    price: 28900,
    originalPrice: 69000,
    image: '/apparel/brospick-sportswear-1.png',
    description: '편안한 착용감과 스타일을 겸비한 BROSPICK Half-Zip Training Top입니다. 운동할 때뿐만 아니라 일상에서도 부담 없이 착용할 수 있는 디자인으로 제작되었습니다.',
    sizes: ['S', 'M', 'L', 'XL'],
    details: [
      '편안한 착용감을 위한 프리미엄 소재 사용',
      '땀 흡수 및 빠른 건조 기능',
      '브로스픽 로고 자수',
      '세탁 시 변형 최소화',
    ],
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const product = products[params.id];

  if (!product) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>상품을 찾을 수 없습니다</h1>
          <Link href="/apparel" className={styles.backLink}>
            ← 의류 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      image: product.image,
      quantity,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      image: product.image,
      quantity,
    });

    router.push('/checkout');
  };

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <Link href="/apparel" className={styles.backLink}>
            ← 의류 목록으로 돌아가기
          </Link>

          <div className={styles.productDetail}>
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = '/apparel/brospick-sportswear-1.png';
                  }}
                />
              </div>
            </div>

            <div className={styles.infoSection}>
              <h1 className={styles.productName}>{product.name}</h1>

              <div className={styles.priceSection}>
                <span className={styles.price}>₩{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>
                    ₩{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div className={styles.description}>
                <p>{product.description}</p>
              </div>

              <div className={styles.details}>
                <h3>제품 상세 정보</h3>
                <ul>
                  {product.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.sizeSection}>
                <h3>사이즈 선택</h3>
                <div className={styles.sizeOptions}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`${styles.sizeButton} ${
                        selectedSize === size ? styles.selected : ''
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.quantitySection}>
                <h3>수량</h3>
                <div className={styles.quantityControls}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </button>
                  <span className={styles.quantity}>{quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.addToCartButton}
                  onClick={handleAddToCart}
                  disabled={showSuccess}
                >
                  {showSuccess ? '장바구니에 추가됨 ✓' : '장바구니에 추가'}
                </button>
                <button className={styles.buyNowButton} onClick={handleBuyNow}>
                  바로 구매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

