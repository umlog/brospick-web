'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { useCart } from '../../contexts/CartContext';
import { products, getDiscountPercent, type ProductSlug } from '../../../lib/products';
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
  params: { slug: string };
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [thumbRef, thumbApi] = useEmblaCarousel({ dragFree: true, containScroll: 'keepSnaps', align: 'start' });
  const [sizeStatuses, setSizeStatuses] = useState<Record<string, string>>({});
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [sizeDelayTexts, setSizeDelayTexts] = useState<Record<string, string>>({});
  const [dbPrice, setDbPrice] = useState<{ price: number; original_price: number | null } | null>(null);

  const product = products[params.slug as ProductSlug];

  useEffect(() => {
    if (!product) return;
    fetch('/api/products/prices')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.prices || []).find((p: { id: number }) => p.id === product.id);
        if (found) setDbPrice({ price: found.price, original_price: found.original_price });
      })
      .catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    fetch('/api/products/sizes')
      .then((res) => res.json())
      .then((data) => {
        const statusMap: Record<string, string> = {};
        const stockMap: Record<string, number> = {};
        const delayTextMap: Record<string, string> = {};
        for (const item of data.sizes || []) {
          const key = `${item.product_id}-${item.size}`;
          statusMap[key] = item.status;
          stockMap[key] = item.stock ?? 0;
          if (item.delay_text) delayTextMap[key] = item.delay_text;
        }
        setSizeStatuses(statusMap);
        setSizeStocks(stockMap);
        setSizeDelayTexts(delayTextMap);
      })
      .catch(() => {});
  }, []);

  const price = dbPrice?.price ?? product?.price ?? 0;
  const originalPrice = dbPrice !== null ? dbPrice.original_price : product?.originalPrice ?? null;

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
      price,
      size: selectedSize,
      image: product.image,
      quantity,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentImage(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  useEffect(() => {
    if (!thumbApi) return;
    const onScroll = () => {
      setScrollProgress(Math.max(0, Math.min(1, thumbApi.scrollProgress())) * 100);
    };
    thumbApi.on('scroll', onScroll);
    onScroll();
    return () => { thumbApi.off('scroll', onScroll); };
  }, [thumbApi]);

  const onThumbClick = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    if (!checkSelectedStock()) return;

    addToCart({
      id: product.id,
      name: product.name,
      price,
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
              <div className={styles.mainImage} ref={emblaRef}>
                <div className={styles.emblaContainer}>
                  {product.images.map((img, index) => (
                    <div className={styles.emblaSlide} key={index}>
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.dotRow}>
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === currentImage ? styles.dotActive : ''}`}
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`이미지 ${index + 1}`}
                  />
                ))}
              </div>

              <div className={styles.thumbEmbla} ref={thumbRef}>
                <div className={styles.thumbContainer}>
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      className={`${styles.thumbnail} ${index === currentImage ? styles.thumbnailActive : ''}`}
                      onClick={() => onThumbClick(index)}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${scrollProgress}%` }} />
              </div>
            </div>

            <div className={styles.infoSection}>
              <h1 className={styles.productName}>{product.name}</h1>

              <div className={styles.priceSection}>
                <span className={styles.price}>₩{price.toLocaleString()}</span>
                {originalPrice && (
                  <>
                    <span className={styles.originalPrice}>
                      ₩{originalPrice.toLocaleString()}
                    </span>
                    <span className={styles.discountBadge}>
                      {getDiscountPercent(price, originalPrice)}%
                    </span>
                  </>
                )}
              </div>

              {product.sizeChart.length > 0 && <div className={styles.sizeChartInline}>
                <p className={styles.sizeUnit}>단위: cm</p>
                <table className={styles.sizeTable}>
                  {product.sizeChartType === 'shorts' ? (
                    <>
                      <thead>
                        <tr>
                          <th>사이즈</th>
                          <th>총장</th>
                          <th>허리(반둘레)</th>
                          {product.sizeChart.some((r) => r.hip !== undefined) && <th>엉덩이</th>}
                          {product.sizeChart.some((r) => r.hem !== undefined) && <th>밑단</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.map((row) => (
                          <tr key={row.size}>
                            <td>{row.size}</td>
                            <td>{row.length}</td>
                            <td>{row.waist ?? '—'}</td>
                            {product.sizeChart.some((r) => r.hip !== undefined) && <td>{row.hip ?? '—'}</td>}
                            {product.sizeChart.some((r) => r.hem !== undefined) && <td>{row.hem ?? '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </>
                  ) : product.sizeChartType === 'pants' ? (
                    <>
                      <thead>
                        <tr>
                          <th>사이즈</th>
                          <th>총장</th>
                          <th>엉덩이</th>
                          <th>허리</th>
                          <th>앞밑위</th>
                          <th>밑단</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.map((row) => (
                          <tr key={row.size}>
                            <td>{row.size}</td>
                            <td>{row.length}</td>
                            <td>{row.hip ?? '—'}</td>
                            <td>{row.waist ?? '—'}</td>
                            <td>{row.rise ?? '—'}</td>
                            <td>{row.hem ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr>
                          <th>사이즈</th>
                          <th>총장</th>
                          <th>{product.chestLabel ?? '가슴단면'}</th>
                          <th>소매길이</th>
                          {product.sizeChart.some((r) => r.hem !== undefined) && <th>밑단</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.map((row) => (
                          <tr key={row.size}>
                            <td>{row.size}</td>
                            <td>{row.length}</td>
                            <td>{row.chest}</td>
                            <td>{row.sleeve}</td>
                            {product.sizeChart.some((r) => r.hem !== undefined) && <td>{row.hem ?? '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
                <p className={styles.sizeDisclaimer}>개인 체형 및 착용 취향에 따라 차이가 있을 수 있으며, 1–2cm 오차가 발생할 수 있습니다.</p>
              </div>}

              {product.comingSoon ? (
                <div className={styles.comingSoonNotice}>
                  <span className={styles.comingSoonNoticeBadge}>COMING SOON</span>
                  <p>해당 상품은 현재 출시 준비 중입니다.</p>
                  <p>출시 소식은 인스타그램을 통해 먼저 확인하세요.</p>
                </div>
              ) : (
                <>
                  <div className={styles.sizeSection}>
                    <h3>사이즈 선택</h3>
                    <div className={styles.sizeOptions}>
                      {product.sizes.map((size) => {
                        const key = `${product.id}-${size}`;
                        const sizeStatus = sizeStatuses[key] || 'available';
                        const stock = sizeStocks[key] ?? null;
                        const isSoldOut = sizeStatus === 'sold_out';
                        const isDelayed = sizeStatus === 'delayed';
                        const delayText = sizeDelayTexts[key] || '지연배송';
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
                                if (confirm(`해당 사이즈는 ${delayText} 상품입니다.\n주문하시겠습니까?`)) {
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
                            {isDelayed && <span className={styles.delayedLabel}>{delayText}</span>}
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
                </>
              )}

              <div className={styles.featureChips}>
                {product.features.map((f, i) => (
                  <span key={i} className={styles.featureChip}>{f.label}</span>
                ))}
              </div>

              <div className={styles.accordionGroup}>
                <Accordion title="제품 설명">
                  <div className={styles.accordionContent}>
                    {product.details.functions.length > 0 && (
                      <>
                        <h4>기능</h4>
                        <ul>
                          {product.details.functions.map((item, i) => (
                            <li key={i}><strong>{item.title}</strong> — {item.description}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {product.details.design.length > 0 && (
                      <>
                        <h4>디자인</h4>
                        <ul>
                          {product.details.design.map((item, i) => (
                            <li key={i}><strong>{item.title}</strong> — {item.description}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    <h4>소재</h4>
                    <p>{product.details.material}</p>
                  </div>
                </Accordion>

                <Accordion title="사이즈 가이드">
                  <div className={styles.accordionContent}>
                    <p className={styles.sizeUnit}>단위: cm</p>
                    <table className={styles.sizeTable}>
                      {product.sizeChartType === 'shorts' ? (
                        <>
                          <thead>
                            <tr>
                              <th>사이즈</th>
                              <th>총장</th>
                              <th>허리(반둘레)</th>
                              {product.sizeChart.some((r) => r.hip !== undefined) && <th>엉덩이</th>}
                              {product.sizeChart.some((r) => r.hem !== undefined) && <th>밑단</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {product.sizeChart.map((row) => (
                              <tr key={row.size}>
                                <td>{row.size}</td>
                                <td>{row.length}</td>
                                <td>{row.waist ?? '—'}</td>
                                {product.sizeChart.some((r) => r.hip !== undefined) && <td>{row.hip ?? '—'}</td>}
                                {product.sizeChart.some((r) => r.hem !== undefined) && <td>{row.hem ?? '—'}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </>
                      ) : product.sizeChartType === 'pants' ? (
                        <>
                          <thead>
                            <tr>
                              <th>사이즈</th>
                              <th>총장</th>
                              <th>엉덩이</th>
                              <th>허리</th>
                              <th>앞밑위</th>
                              <th>밑단</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.sizeChart.map((row) => (
                              <tr key={row.size}>
                                <td>{row.size}</td>
                                <td>{row.length}</td>
                                <td>{row.hip ?? '—'}</td>
                                <td>{row.waist ?? '—'}</td>
                                <td>{row.rise ?? '—'}</td>
                                <td>{row.hem ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      ) : (
                        <>
                          <thead>
                            <tr>
                              <th>사이즈</th>
                              <th>총장</th>
                              <th>{product.chestLabel ?? '가슴단면'}</th>
                              <th>소매길이</th>
                              {product.sizeChart.some((r) => r.hem !== undefined) && <th>밑단</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {product.sizeChart.map((row) => (
                              <tr key={row.size}>
                                <td>{row.size}</td>
                                <td>{row.length}</td>
                                <td>{row.chest}</td>
                                <td>{row.sleeve}</td>
                                {product.sizeChart.some((r) => r.hem !== undefined) && <td>{row.hem ?? '—'}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}
                    </table>
                    <p className={styles.sizeDisclaimer}>개인 체형 및 착용 취향에 따라 차이가 있을 수 있으며, 1–2cm 오차가 발생할 수 있습니다.</p>
                  </div>
                </Accordion>

                <Accordion title="배송">
                  <div className={styles.accordionContent}>
                    <ul>
                      <li>배송비: ₩{SHIPPING.fee.toLocaleString()} (주문당 1회 청구)</li>
                      <li>여러 상품을 함께 구매해도 배송비는 1회만 청구됩니다</li>
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

        {!product.comingSoon && (
          <div className={styles.stickyBuyBar}>
            <div className={styles.stickyBuyBarInner}>
              <div className={styles.stickyBuyBarInfo}>
                <span className={styles.stickyBuyBarPrice}>₩{price.toLocaleString()}</span>
                <span className={styles.stickyBuyBarSize}>
                  {selectedSize ? `사이즈: ${selectedSize}` : '사이즈를 선택하세요'}
                </span>
              </div>
              <div className={styles.stickyBuyBarActions}>
                <button
                  className={styles.stickyCartButton}
                  onClick={handleAddToCart}
                  disabled={showSuccess}
                >
                  {showSuccess ? '✓' : '장바구니'}
                </button>
                <button className={styles.stickyBuyButton} onClick={handleBuyNow}>
                  바로 구매
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
  );
}
