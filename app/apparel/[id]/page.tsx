'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { products, getDiscountPercent } from '../../../lib/products';
import { SHIPPING, CONTACT } from '../../../lib/constants';
import styles from './product-detail.module.css';

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
  const [sizeStatuses, setSizeStatuses] = useState<Record<string, string>>({});
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});

  const product = products[params.id];

  useEffect(() => {
    fetch('/api/products/sizes')
      .then((res) => res.json())
      .then((data) => {
        const statusMap: Record<string, string> = {};
        const stockMap: Record<string, number> = {};
        for (const item of data.sizes || []) {
          const key = `${item.product_id}-${item.size}`;
          statusMap[key] = item.status;
          stockMap[key] = item.stock ?? 0;
        }
        setSizeStatuses(statusMap);
        setSizeStocks(stockMap);
      })
      .catch(() => {});
  }, []);

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

  const checkSelectedStock = (): boolean => {
    const key = `${product.id}-${selectedSize}`;
    const status = sizeStatuses[key];
    if (status === undefined) return true; // 데이터 미로드 시 허용 (서버에서 최종 체크)
    const stock = sizeStocks[key] ?? 0;
    if (status === 'sold_out' || stock <= 0) {
      alert(`${selectedSize} 사이즈가 품절되었습니다.`);
      return false;
    }
    if (quantity > stock) {
      alert(`${selectedSize} 사이즈의 재고가 부족합니다. (남은 재고: ${stock}개)`);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    if (!checkSelectedStock()) return;

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
    if (!checkSelectedStock()) return;

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
                      {getDiscountPercent(product.price, product.originalPrice)}%
                    </span>
                  </>
                )}
              </div>

              <div className={styles.sizeChartInline}>
                <p className={styles.sizeUnit}>단위: cm</p>
                <table className={styles.sizeTable}>
                  <thead>
                    <tr>
                      <th>사이즈</th>
                      <th>총장</th>
                      <th>가슴단면</th>
                      <th>소매길이</th>
                      <th>밑단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeChart.map((row) => (
                      <tr key={row.size}>
                        <td>{row.size}</td>
                        <td>{row.length}</td>
                        <td>{row.chest}</td>
                        <td>{row.sleeve}</td>
                        <td>{row.hem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={styles.sizeDisclaimer}>개인 체형 및 착용 취향에 따라 차이가 있을 수 있으며, 1–2cm 오차가 발생할 수 있습니다.</p>
              </div>

              <div className={styles.sizeSection}>
                <h3>사이즈 선택</h3>
                <div className={styles.sizeOptions}>
                  {product.sizes.map((size) => {
                    const key = `${product.id}-${size}`;
                    const sizeStatus = sizeStatuses[key] || 'available';
                    const stock = sizeStocks[key] ?? null;
                    const isSoldOut = sizeStatus === 'sold_out';
                    const isDelayed = sizeStatus === 'delayed';
                    const showLowStock = !isSoldOut && stock !== null && stock > 0 && stock <= 5;
                    return (
                      <button
                        key={size}
                        className={`${styles.sizeButton} ${
                          selectedSize === size ? styles.selected : ''
                        } ${isSoldOut ? styles.soldOut : ''} ${isDelayed ? styles.delayed : ''}`}
                        onClick={() => {
                          if (isSoldOut) return;
                          if (isDelayed) {
                            if (confirm('해당 사이즈는 주문 후 약 3주 뒤 발송됩니다.\n주문하시겠습니까?')) {
                              setSelectedSize(size);
                            }
                            return;
                          }
                          setSelectedSize(size);
                        }}
                        disabled={isSoldOut}
                      >
                        {size}
                        {isSoldOut && <span className={styles.soldOutLine} />}
                        {isDelayed && <span className={styles.delayedLabel}>3주 뒤 발송</span>}
                        {showLowStock && <span className={styles.lowStockLabel}>잔여 {stock}개</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.quantitySection}>
                <h3>수량</h3>
                <div className={styles.quantityRow}>
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
                      onClick={() => {
                        const key = `${product.id}-${selectedSize}`;
                        const stock = selectedSize ? (sizeStocks[key] || Infinity) : Infinity;
                        setQuantity(Math.min(quantity + 1, stock));
                      }}
                    >
                      +
                    </button>
                  </div>
                  {(() => {
                    if (!selectedSize) return null;
                    const key = `${product.id}-${selectedSize}`;
                    const status = sizeStatuses[key];
                    const stock = sizeStocks[key] ?? 0;
                    if (status && status !== 'sold_out' && stock > 0 && stock <= 5) {
                      return <span className={styles.quantityLowStock}>{stock}개 남음</span>;
                    }
                    return null;
                  })()}
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
                  {product.features.map((f, i) => (
                    <li key={i}><strong>{f.label}</strong>{f.detail}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.accordionGroup}>
                <Accordion title="제품 설명">
                  <div className={styles.accordionContent}>
                    <h4>기능</h4>
                    <ul>
                      {product.details.functions.map((item, i) => (
                        <li key={i}><strong>{item.title}</strong> — {item.description}</li>
                      ))}
                    </ul>

                    <h4>디자인</h4>
                    <ul>
                      {product.details.design.map((item, i) => (
                        <li key={i}><strong>{item.title}</strong> — {item.description}</li>
                      ))}
                    </ul>

                    <h4>소재</h4>
                    <p>{product.details.material}</p>
                  </div>
                </Accordion>

                <Accordion title="사이즈 가이드">
                  <div className={styles.accordionContent}>
                    <p className={styles.sizeUnit}>단위: cm</p>
                    <table className={styles.sizeTable}>
                      <thead>
                        <tr>
                          <th>사이즈</th>
                          <th>총장</th>
                          <th>가슴단면</th>
                          <th>소매길이</th>
                          <th>밑단</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.map((row) => (
                          <tr key={row.size}>
                            <td>{row.size}</td>
                            <td>{row.length}</td>
                            <td>{row.chest}</td>
                            <td>{row.sleeve}</td>
                            <td>{row.hem}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className={styles.sizeDisclaimer}>개인 체형 및 착용 취향에 따라 차이가 있을 수 있으며, 1–2cm 오차가 발생할 수 있습니다.</p>
                  </div>
                </Accordion>

                <Accordion title="배송">
                  <div className={styles.accordionContent}>
                    <ul>
                      <li>배송비: ₩{SHIPPING.fee.toLocaleString()}</li>
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
                      <li>문의: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
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
