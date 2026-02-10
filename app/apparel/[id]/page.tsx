'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import styles from './product-detail.module.css';

const products: Record<string, {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  tagline: string;
  description: string;
  sizes: string[];
  soldOut?: string[];
}> = {
  '1': {
    id: 1,
    name: 'Half-Zip Training Top',
    price: 29900,
    originalPrice: 69000,
    image: '/apparel/bp-detail1.JPG',
    images: [
      '/apparel/bp-detail1.JPG',
      '/apparel/bp-detailpoint.JPG',
      '/apparel/bp-light-second.png',
      '/apparel/bp-light-main.png',
      '/apparel/bp-sizes.JPG',
    ],
    tagline: '가볍게 입고, 강하게 뛰는 브로스픽 반집업 트레이닝 탑',
    description: '편안한 착용감과 슬림한 실루엣을 동시에 잡은 Half-Zip Training Top. 고탄성 원단으로 몸을 안정감 있게 잡아주면서도 움직임은 자유롭고, 땀은 빠르게 건조되어 격한 운동에도 쾌적함을 유지해 줍니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    soldOut: ['XL'],
  },
};

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.accordion}>
      <button
        className={styles.accordionHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.accordionTitle}>{title}</span>
        <span className={`${styles.accordionToggle} ${open ? styles.accordionToggleOpen : ''}`}>+</span>
      </button>
      {open && (
        <div className={styles.accordionBody}>
          {children}
        </div>
      )}
    </div>
  );
}

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
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && currentImage < product.images.length - 1) {
      setCurrentImage(currentImage + 1);
    }
    if (distance < -minSwipeDistance && currentImage > 0) {
      setCurrentImage(currentImage - 1);
    }
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
              <div
                className={styles.mainImage}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={product.images[currentImage]}
                  alt={`${product.name} ${currentImage + 1}`}
                  draggable={false}
                />
              </div>
              <div className={styles.thumbnails}>
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${index === currentImage ? styles.thumbnailActive : ''}`}
                    onClick={() => setCurrentImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.infoSection}>
              <h1 className={styles.productName}>{product.name}</h1>

              <div className={styles.priceSection}>
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

              <div className={styles.sizeChartInline}>
                <table className={styles.sizeTable}>
                  <thead>
                    <tr>
                      <th>사이즈</th>
                      <th>키 (cm)</th>
                      <th>몸무게 (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>155–160</td><td>55–60</td></tr>
                    <tr><td>M</td><td>160–165</td><td>60–65</td></tr>
                    <tr><td>L</td><td>165–170</td><td>65–70</td></tr>
                    <tr><td>XL</td><td>170–175</td><td>70–75</td></tr>
                    <tr><td>2XL</td><td>175–180</td><td>75–80</td></tr>
                  </tbody>
                </table>

              </div>

              <div className={styles.sizeSection}>
                <h3>사이즈 선택</h3>
                <div className={styles.sizeOptions}>
                  {product.sizes.map((size) => {
                    const isSoldOut = product.soldOut?.includes(size);
                    return (
                      <button
                        key={size}
                        className={`${styles.sizeButton} ${
                          selectedSize === size ? styles.selected : ''
                        } ${isSoldOut ? styles.soldOut : ''}`}
                        onClick={() => !isSoldOut && setSelectedSize(size)}
                        disabled={isSoldOut}
                      >
                        {size}
                        {isSoldOut && <span className={styles.soldOutLine} />}
                      </button>
                    );
                  })}
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

              <div className={styles.description}>
                <ul className={styles.featureList}>
                  <li><strong>편안한 착용감</strong>과 <strong>슬림한 실루엣</strong>을 동시에</li>
                  <li><strong>고탄성 원단</strong>으로 안정감 있는 핏</li>
                  <li><strong>자유로운 움직임</strong> — 어떤 운동에도 OK</li>
                  <li><strong>빠른 건조</strong> — 격한 운동에도 쾌적</li>
                </ul>
              </div>

              <div className={styles.accordionGroup}>
                <Accordion title="제품 설명">
                  <div className={styles.accordionContent}>
                    <h4>기능</h4>
                    <ul>
                      <li><strong>핑거홀 디자인</strong> — 핑거홀 디자인으로 안정적인 착용감</li>
                      <li><strong>퀵드라이</strong> — 땀 흡수 후 빠른 건조</li>
                      <li><strong>4방향 스트레치</strong> — 러닝, 웨이트, 축구 모두 커버</li>
                      <li><strong>라이트웨이트</strong> — 가벼운 착용감, 레이어드에도 부담 없음</li>
                      <li><strong>통기성</strong> — 장시간 착용에도 쾌적</li>
                    </ul>

                    <h4>디자인</h4>
                    <ul>
                      <li><strong>어깨 체크 패턴</strong> — 단색 상의에서도 포인트 연출</li>
                      <li><strong>하프 집업 넥</strong> — 체온 조절이 쉬운 반집업, 보온성 강화</li>
                      <li><strong>슬림 실루엣</strong> — 옆 라인을 따라 몸매를 정리해 주는 핏</li>
                      <li><strong>미니멀 로고</strong> — 전면 BR 로고, 후면 BROSPICK 레터링</li>
                      <li><strong>리플렉티브 디테일</strong> — 야간 러닝 시 안전성 향상, 조명 아래 하이라이트 연출</li>
                    </ul>

                    <h4>소재</h4>
                    <p>프리미엄 기능성 폴리에스터 + 스판 혼방. 부드러운 터치감과 높은 신축성, 세탁 시 수축과 뒤틀림을 최소화한 내구성.</p>
                  </div>
                </Accordion>

                <Accordion title="사이즈 가이드">
                  <div className={styles.accordionContent}>
                    <p className={styles.sizeNote}>슬림핏 기준으로 제작되었습니다. 여유 있는 착용감을 원하시면 한 사이즈 업을 권장합니다.</p>
                    <table className={styles.sizeTable}>
                      <thead>
                        <tr>
                          <th>사이즈</th>
                          <th>키 (cm)</th>
                          <th>몸무게 (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>S</td><td>155–160</td><td>55–60</td></tr>
                        <tr><td>M</td><td>160–165</td><td>60–65</td></tr>
                        <tr><td>L</td><td>165–170</td><td>65–70</td></tr>
                        <tr><td>XL</td><td>170–175</td><td>70–75</td></tr>
                        <tr><td>2XL</td><td>175–180</td><td>75–80</td></tr>
                      </tbody>
                    </table>
                    <p className={styles.sizeDisclaimer}>개인 체형 및 착용 취향에 따라 차이가 있을 수 있으며, 1–3cm 오차가 발생할 수 있습니다.</p>
                  </div>
                </Accordion>

                <Accordion title="배송">
                  <div className={styles.accordionContent}>
                    <ul>
                      <li>배송비: ₩3,500 → 무료 (할인)</li>
                      <li>입금 확인 후 1~3 영업일 이내 발송</li>
                      <li>발송 후 1~2일 이내 수령 (지역에 따라 상이)</li>
                      <li>제주/도서산간 지역은 추가 배송비가 발생할 수 있습니다</li>
                    </ul>
                  </div>
                </Accordion>

                <Accordion title="반품 & 교환">
                  <div className={styles.accordionContent}>
                    <ul>
                      <li>수령 후 7일 이내 교환/반품 가능</li>
                      <li>단순 변심에 의한 반품 시 왕복 배송비 고객 부담</li>
                      <li>제품 하자의 경우 배송비 무료 교환/반품</li>
                      <li>착용 흔적이 있거나 태그 제거 시 교환/반품 불가</li>
                      <li>문의: <a href="mailto:team.brospick@gmail.com">team.brospick@gmail.com</a></li>
                    </ul>
                  </div>
                </Accordion>
              </div>

            </div>
          </div>
        </div>
      </main>
  );
}
