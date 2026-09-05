'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useCart } from '../../contexts/CartContext';
import { products, getDiscountPercent, getProductHref, BOOTSKIN_CATEGORY, type ProductSlug, type ProductColor } from '../../../lib/products';
import { SHIPPING, CONTACT, RETURN_POLICY, CARE_INSTRUCTIONS, SOCIAL_MEDIA } from '../../../lib/constants';
import { trackViewContent, trackAddToCart } from '../../../lib/analytics';
import styles from './product-detail.module.css';
import BeforeAfterSlider from './BeforeAfterSlider';
import { BOOTSKIN_FAQ } from '../../bootskin/bootskin.config';
import { renderFaqAnswer } from '../../bootskin/components/BootskinFaq';
import ReviewLightbox from '../../components/ReviewLightbox';
import ProductImage from '../../components/ProductImage';

/**
 * 상세 배너의 레이아웃 예약용 기준 크기. 상품마다 실제 배너 비율이 달라
 * (860x1100 ~ 1254x1254 등) 렌더 비율은 CSS의 height: auto가 원본에서 가져온다.
 * 이 값은 next/image가 요구하는 초기 예약 박스일 뿐이다.
 */
const DETAIL_BANNER_BASE_WIDTH = 1080;
const DETAIL_BANNER_BASE_HEIGHT = 1380;
/** PC는 2열 그리드의 왼쪽 열, 모바일(968px 이하)은 전체 폭을 차지한다. */
const DETAIL_BANNER_SIZES = '(max-width: 968px) 100vw, 50vw';

function DetailBannerImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={DETAIL_BANNER_BASE_WIDTH}
      height={DETAIL_BANNER_BASE_HEIGHT}
      sizes={DETAIL_BANNER_SIZES}
      className={styles.detailBannerImage}
    />
  );
}

interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  reviewer_name: string;
  created_at: string;
  images: string[];
  height?: number | null;
  usual_size?: string | null;
  helpful_count: number;
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, color: '#f5a623', letterSpacing: 1 }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'var(--color-border)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

const PHOTO_PREVIEW = 9;

function ProductReviews({ productId, initialReviews, initialAvgRating, initialCount }: {
  productId: number;
  productSlug?: string;
  initialReviews: ReviewItem[];
  initialAvgRating: number;
  initialCount: number;
}) {
  const [reviews, setReviews] = React.useState<ReviewItem[]>(initialReviews);
  const [avgRating, setAvgRating] = React.useState(initialAvgRating);
  const [count, setCount] = React.useState(initialCount);
  const [loading, setLoading] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState('');
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [photoOnly, setPhotoOnly] = React.useState(false);
  const [showAllPhotos, setShowAllPhotos] = React.useState(false);
  const [likedIds, setLikedIds] = React.useState<Set<string>>(new Set());
  const [fingerprint, setFingerprint] = React.useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('brospick-last-order');
    if (saved) setLastOrder(saved);

    // fingerprint 초기화
    let fp = localStorage.getItem('brospick-fp');
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem('brospick-fp', fp);
    }
    setFingerprint(fp);

    // 이미 좋아요한 리뷰 ID 로드
    try {
      const liked = JSON.parse(localStorage.getItem('brospick-liked-reviews') || '[]');
      setLikedIds(new Set(liked));
    } catch { /* ignore */ }
  }, [productId]);

  const handleLike = async (reviewId: string) => {
    if (!fingerprint) return;
    const res = await fetch('/api/reviews/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, fingerprint }),
    });
    if (!res.ok) return;
    const { liked, helpful_count } = await res.json();

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful_count } : r))
    );
    setLikedIds((prev) => {
      const next = new Set(prev);
      liked ? next.add(reviewId) : next.delete(reviewId);
      localStorage.setItem('brospick-liked-reviews', JSON.stringify([...next]));
      return next;
    });
  };

  const formatDate = (str: string) => {
    const d = new Date(str);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const allPhotos = React.useMemo(() => reviews.flatMap((r) => r.images ?? []), [reviews]);

  const getPhotoOffset = (reviewIndex: number) =>
    reviews.slice(0, reviewIndex).reduce((acc, r) => acc + (r.images?.length ?? 0), 0);

  const distribution = React.useMemo(
    () => [5, 4, 3, 2, 1].map((star) => ({ star, cnt: reviews.filter((r) => r.rating === star).length })),
    [reviews]
  );

  const photoReviews = React.useMemo(() => reviews.filter((r) => (r.images?.length ?? 0) > 0), [reviews]);
  const displayedReviews = photoOnly ? photoReviews : reviews;
  const visiblePhotos = showAllPhotos ? allPhotos : allPhotos.slice(0, PHOTO_PREVIEW);
  const reviewLink = lastOrder ? `/review?orderNumber=${encodeURIComponent(lastOrder)}` : '/review';

  return (
    <div className={styles.reviewsSection}>
      {/* ── 헤더 ── */}
      <div className={styles.reviewsHeader}>
        <h2 className={styles.reviewsHeading}>구매 후기</h2>
        <a href={reviewLink} className={styles.reviewsWriteButton}>리뷰 작성</a>
      </div>

      {loading ? (
        <p className={styles.reviewsEmpty}>로딩 중...</p>
      ) : count === 0 ? (
        <div className={styles.reviewsEmptyBlock}>
          <p className={styles.reviewsEmpty}>아직 작성된 리뷰가 없습니다.</p>
          <a href={reviewLink} className={styles.reviewsEmptyLink}>첫 번째 리뷰를 남겨주세요 →</a>
        </div>
      ) : (
        <>
          {/* ── 평점 요약 ── */}
          <div className={styles.ratingSummary}>
            <div className={styles.ratingLeft}>
              <span className={styles.ratingNum}>{avgRating}</span>
              <StarDisplay rating={Math.round(avgRating)} size={20} />
              <span className={styles.ratingTotal}>{count}개 리뷰</span>
            </div>
            <div className={styles.ratingBars}>
              {distribution.map(({ star, cnt }) => (
                <div key={star} className={styles.ratingBarRow}>
                  <span className={styles.ratingBarLabel}>{star}★</span>
                  <div className={styles.ratingBarBg}>
                    <div
                      className={styles.ratingBarFill}
                      style={{ width: count > 0 ? `${(cnt / count) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className={styles.ratingBarCount}>{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 포토리뷰 그리드 ── */}
          {allPhotos.length > 0 && (
            <div className={styles.photoSection}>
              <p className={styles.photoSectionTitle}>
                포토리뷰 <span className={styles.photoSectionCount}>{allPhotos.length}장</span>
              </p>
              <div className={styles.photoGrid}>
                {visiblePhotos.map((url, i) => {
                  const isLastMore = !showAllPhotos && i === PHOTO_PREVIEW - 1 && allPhotos.length > PHOTO_PREVIEW;
                  return (
                    <button key={i} className={styles.photoGridItem} onClick={() => setLightboxIndex(i)}>
                      <ProductImage src={url} alt="" sizes="(max-width: 768px) 33vw, 120px" />
                      {isLastMore && (
                        <div className={styles.photoGridMore}>+{allPhotos.length - PHOTO_PREVIEW}</div>
                      )}
                    </button>
                  );
                })}
              </div>
              {!showAllPhotos && allPhotos.length > PHOTO_PREVIEW && (
                <button className={styles.photoShowMore} onClick={() => setShowAllPhotos(true)}>
                  전체 사진 보기 ({allPhotos.length}장)
                </button>
              )}
            </div>
          )}

          {/* ── 필터 탭 ── */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${!photoOnly ? styles.filterTabActive : ''}`}
              onClick={() => setPhotoOnly(false)}
            >
              전체 <span className={styles.filterTabCount}>{count}</span>
            </button>
            {photoReviews.length > 0 && (
              <button
                className={`${styles.filterTab} ${photoOnly ? styles.filterTabActive : ''}`}
                onClick={() => setPhotoOnly(true)}
              >
                포토 <span className={styles.filterTabCount}>{photoReviews.length}</span>
              </button>
            )}
          </div>

          {/* ── 리뷰 목록 ── */}
          <div className={styles.reviewsList}>
            {displayedReviews.map((r) => {
              const actualIdx = reviews.indexOf(r);
              return (
                <div key={r.id} className={styles.reviewCard}>
                  <div className={styles.reviewCardMeta}>
                    <span className={styles.reviewAuthor}>
                      {r.reviewer_name.slice(0, 1)}*{r.reviewer_name.slice(-1)}
                    </span>
                    <span className={styles.reviewDate}>{formatDate(r.created_at)}</span>
                  </div>
                  <StarDisplay rating={r.rating} size={14} />
                  {(r.height || r.usual_size) && (
                    <p className={styles.reviewSizeInfo}>
                      {r.height && `키 ${r.height}cm`}
                      {r.height && r.usual_size && ' · '}
                      {r.usual_size && `평소 ${r.usual_size}`}
                    </p>
                  )}
                  {(r.images?.length ?? 0) > 0 && (
                    <div className={styles.reviewImages}>
                      {r.images.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt={`리뷰 이미지 ${i + 1}`}
                          className={styles.reviewImage}
                          onClick={() => setLightboxIndex(getPhotoOffset(actualIdx) + i)}
                        />
                      ))}
                    </div>
                  )}
                  <p className={styles.reviewContent}>{r.content}</p>
                  <button
                    className={`${styles.likeButton} ${likedIds.has(r.id) ? styles.likeButtonActive : ''}`}
                    onClick={() => handleLike(r.id)}
                    aria-label="도움이 됐어요"
                  >
                    <span className={styles.likeIcon}>👍</span>
                    <span>도움이 됐어요</span>
                    {r.helpful_count > 0 && (
                      <span className={styles.likeCount}>{r.helpful_count}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {lightboxIndex !== null && (
        <ReviewLightbox
          images={allPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

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

interface SizeRow {
  product_id: number;
  size: string;
  status: string;
  stock: number;
  delay_text?: string | null;
}

interface DbPrice {
  name?: string;
  price: number;
  original_price: number | null;
}

interface Props {
  params: { slug: string };
  initialPrice: DbPrice | null;
  initialSizes: SizeRow[];
  dbComingSoon?: boolean | null;
  initialReviews: ReviewItem[];
  initialAvgRating: number;
  initialReviewCount: number;
}

export default function ProductDetailClient({ params, initialPrice, initialSizes, dbComingSoon, initialReviews, initialAvgRating, initialReviewCount }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPartIdx, setSelectedPartIdx] = useState(0);
  const [selectedTopSize, setSelectedTopSize] = useState('');
  const [selectedBottomSize, setSelectedBottomSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [thumbRef, thumbApi] = useEmblaCarousel({ dragFree: true, containScroll: 'keepSnaps', align: 'start' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [logoInquiryOpen, setLogoInquiryOpen] = useState(false);
  const [bulkInquiryOpen, setBulkInquiryOpen] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(undefined);
  const modalScrollY = useRef(0);

  const product = products[params.slug as ProductSlug];
  const isBulkCategory = product?.category === 'taping' || product?.category === 'socks' || product?.category === 'boot-skin';
  const isBootSkin = product?.category === BOOTSKIN_CATEGORY;

  // 서버에서 받은 초기 데이터로 size 맵 구성
  const [sizeStatuses, setSizeStatuses] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of initialSizes) map[`${item.product_id}-${item.size}`] = item.status;
    return map;
  });
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initialSizes) map[`${item.product_id}-${item.size}`] = item.stock ?? 0;
    return map;
  });
  const [sizeDelayTexts, setSizeDelayTexts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of initialSizes) {
      if (item.delay_text) map[`${item.product_id}-${item.size}`] = item.delay_text;
    }
    return map;
  });

  const [dbPrice] = useState<DbPrice | undefined>(initialPrice ?? undefined);

  const price = dbPrice?.price;
  const originalPrice = dbPrice?.original_price ?? null;
  const productName = dbPrice?.name ?? product?.name;
  const isComingSoon = dbComingSoon !== null && dbComingSoon !== undefined ? dbComingSoon : product?.comingSoon;

  // 상품 상세 조회 이벤트 (GA4 view_item / Meta ViewContent)
  useEffect(() => {
    if (product) trackViewContent(product.id, productName ?? product.name, price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // 최신 재고·품절 상태를 마운트 시 새로 받아온다.
  // (상세 페이지는 ISR 5분 캐시라, 어드민에서 품절로 바꿔도 반영이 지연되던 문제 보완)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/sizes');
        if (!res.ok) return;
        const data = await res.json();
        const rows: SizeRow[] = Array.isArray(data) ? data : data.sizes ?? [];
        if (cancelled || rows.length === 0) return;

        const statusMap: Record<string, string> = {};
        const stockMap: Record<string, number> = {};
        const delayMap: Record<string, string> = {};
        for (const item of rows) {
          const key = `${item.product_id}-${item.size}`;
          statusMap[key] = item.status;
          stockMap[key] = item.stock ?? 0;
          if (item.delay_text) delayMap[key] = item.delay_text;
        }
        setSizeStatuses(statusMap);
        setSizeStocks(stockMap);
        setSizeDelayTexts(delayMap);
      } catch {
        // 실패 시 SSR 초기 데이터 유지
      }
    })();
    return () => { cancelled = true; };
  }, [product?.id]);

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
    if (product.multiSelect) return true;
    if (product.setParts) return true;
    const coloredSize = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
    const key = `${product.id}-${coloredSize}`;
    const status = sizeStatuses[key];
    if (status === undefined) return true;
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
    if (product.multiSelect) {
      if (selectedSizes.length === 0) {
        alert('선택 항목을 선택해주세요.');
        return;
      }
      if (price === undefined) return;
      for (const size of selectedSizes) {
        addToCart({
          id: product.id,
          name: productName!,
          price,
          size,
          image: product.image,
          quantity,
        });
      }
      trackAddToCart(product.id, productName!, price * quantity * selectedSizes.length, quantity * selectedSizes.length);
      setQuantity(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    }
    if (product.setParts) {
      if (!selectedTopSize) { alert('상의 사이즈를 선택해주세요.'); return; }
      if (!selectedBottomSize) { alert('하의 사이즈를 선택해주세요.'); return; }
      if (price === undefined) return;
      addToCart({
        id: product.id,
        name: productName!,
        price,
        size: `상의: ${selectedTopSize} / 하의: ${selectedBottomSize}`,
        image: product.image,
        quantity,
      });
      trackAddToCart(product.id, productName!, price * quantity, quantity);
      setQuantity(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    }
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    if (price === undefined) return;
    if (!checkSelectedStock()) return;

    const cartSize = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
    const cartImage = selectedColor ? selectedColor.images[0] : product.image;
    addToCart({
      id: product.id,
      name: productName!,
      price,
      size: cartSize,
      image: cartImage,
      quantity,
    });
    trackAddToCart(product.id, productName!, price * quantity, quantity);

    setQuantity(1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  useEffect(() => {
    if (!product) return;
    if (product.setParts) {
      setSelectedPartIdx(0);
      setSelectedTopSize('');
      setSelectedBottomSize('');
      return;
    }
    if (product.multiSelect) {
      setSelectedSizes([]);
      return;
    }
    if (product.sizes.includes('XL')) {
      setSelectedSize('XL');
    } else {
      setSelectedSize(product.sizes[0]);
    }
  }, [product?.slug]);

  useEffect(() => {
    setSelectedColor(product?.colors?.[0]);
  }, [product?.slug]);

  useEffect(() => {
    if (!emblaApi || !thumbApi) return;

    if (selectedColor) {
      const firstImg = selectedColor.images[0];
      const mainImages = product.images.filter(img => !img.includes('size-chart'));
      const idx = mainImages.indexOf(firstImg);
      if (idx >= 0) {
        // 스크롤 모드: 캐러셀 내용은 그대로, 해당 위치로만 스크롤
        setCurrentImage(idx);
        emblaApi.scrollTo(idx);
        thumbApi.scrollTo(idx);
        return;
      }
    }

    // 교체 모드: 캐러셀 내용 자체가 바뀌므로 reInit 후 리셋
    emblaApi.reInit();
    thumbApi.reInit();
    setCurrentImage(0);
    emblaApi.scrollTo(0, true);
  }, [selectedColor, emblaApi, thumbApi]);

  useEffect(() => {
    if (!product || product.multiSelect) return;
    if (Object.keys(sizeStatuses).length === 0 || !selectedSize) return;
    const currentKey = `${product.id}-${selectedSize}`;
    if (sizeStatuses[currentKey] === 'sold_out') {
      const fallback = product.sizes.find((s) => sizeStatuses[`${product.id}-${s}`] !== 'sold_out');
      if (fallback) setSelectedSize(fallback);
    }
  }, [sizeStatuses]);

  const handlePartSelect = (idx: number) => {
    setSelectedPartIdx(idx);
    if (!product.setParts) return;
    const part = product.setParts[idx];
    const carousel = product.images.filter((img) => !img.includes('size-chart'));
    const imgIdx = carousel.indexOf(part.startImage);
    if (imgIdx >= 0) { emblaApi?.scrollTo(imgIdx); thumbApi?.scrollTo(imgIdx); }
  };

  // 부츠스킨 미리보기에서 `?option=7 — Black` 으로 넘어오면 해당 옵션을 미리 선택해 둔다.
  // useSearchParams 대신 location을 읽는 이유: 이 페이지는 정적 생성이라 Suspense 경계가 필요해진다.
  useEffect(() => {
    if (!product) return;
    const option = new URLSearchParams(window.location.search).get('option');
    if (!option) return;

    const colorName = option.split(' — ')[1];
    if (colorName) {
      const matched = product.colors?.find((color) => color.name === colorName);
      if (matched) setSelectedColor(matched);
    }
    if (product.multiSelect) {
      setSelectedSizes((prev) => (prev.includes(option) ? prev : [...prev, option]));
    } else if (product.sizes.includes(option)) {
      setSelectedSize(option);
    }
  }, [product]);

  const handleSizeSelect = (size: string) => {
    if (product.multiSelect) {
      const isRemoving = selectedSizes.includes(size);
      setSelectedSizes((prev) =>
        isRemoving ? prev.filter((s) => s !== size) : [...prev, size]
      );
      if (!isRemoving && product.sizeImages?.[size]) {
        const carousel = product.images.filter((img) => !img.includes('size-chart'));
        const idx = carousel.indexOf(product.sizeImages![size]);
        if (idx >= 0) { emblaApi?.scrollTo(idx); thumbApi?.scrollTo(idx); }
      }
      return;
    }
    setSelectedSize(size);
    setQuantity(1);
    if (product.sizeImages?.[size]) {
      const carousel = product.images.filter((img) => !img.includes('size-chart'));
      const idx = carousel.indexOf(product.sizeImages![size]);
      if (idx >= 0) { emblaApi?.scrollTo(idx); thumbApi?.scrollTo(idx); }
    }
  };

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setCurrentImage(idx);
      thumbApi?.scrollTo(idx);
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, thumbApi]);

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

  useEffect(() => {
    setQuantityInput(String(quantity));
  }, [quantity]);

  // 모달/라이트박스 열릴 때 iOS 호환 scroll lock
  useEffect(() => {
    const anyOpen = lightboxOpen || bulkInquiryOpen || logoInquiryOpen;
    if (anyOpen) {
      modalScrollY.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${modalScrollY.current}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, modalScrollY.current);
      };
    }
  }, [lightboxOpen, bulkInquiryOpen, logoInquiryOpen]);

  const handleBuyNow = () => {
    if (product.multiSelect) {
      if (selectedSizes.length === 0) {
        alert('선택 항목을 선택해주세요.');
        return;
      }
      if (price === undefined) return;
      const items = selectedSizes.map((size) => ({
        id: product.id,
        name: productName!,
        price,
        size,
        image: product.image,
        quantity,
      }));
      for (const item of items) addToCart(item);
      sessionStorage.setItem('checkoutItems', JSON.stringify(items));
      router.push('/checkout');
      return;
    }
    if (product.setParts) {
      if (!selectedTopSize) { alert('상의 사이즈를 선택해주세요.'); return; }
      if (!selectedBottomSize) { alert('하의 사이즈를 선택해주세요.'); return; }
      if (price === undefined) return;
      const item = {
        id: product.id,
        name: productName!,
        price,
        size: `상의: ${selectedTopSize} / 하의: ${selectedBottomSize}`,
        image: product.image,
        quantity,
      };
      addToCart(item);
      sessionStorage.setItem('checkoutItems', JSON.stringify([item]));
      router.push('/checkout');
      return;
    }
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    if (price === undefined) return;
    if (!checkSelectedStock()) return;

    const cartSize = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
    const cartImage = selectedColor ? selectedColor.images[0] : product.image;
    const item = {
      id: product.id,
      name: productName!,
      price,
      size: cartSize,
      image: cartImage,
      quantity,
    };
    addToCart(item);
    sessionStorage.setItem('checkoutItems', JSON.stringify([item]));
    router.push('/checkout');
  };

  const sharedImages = product.images.filter((img) => !img.includes('size-chart'));
  const firstColorImg = selectedColor?.images[0] ?? product.colors?.[0]?.images[0];
  const isColorScrollMode = firstColorImg != null && sharedImages.includes(firstColorImg);
  const carouselImages = (product.colors && !isColorScrollMode)
    ? [...(selectedColor?.images ?? product.colors[0].images), ...sharedImages]
    : sharedImages;

  const colorSection = product.colors && product.colors.length > 1 ? (
    <div className={styles.colorSection}>
      <h3>
        색상 선택
        {selectedColor && <span className={styles.colorName}> — {selectedColor.name}</span>}
      </h3>
      <div className={styles.colorOptions}>
        {product.colors.map((color) => (
          <button
            key={color.name}
            className={`${styles.colorSwatch} ${selectedColor?.name === color.name ? styles.colorSwatchSelected : ''}`}
            onClick={() => setSelectedColor(color)}
            aria-label={color.name}
            title={color.name}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.backLinkRow}>
          <Link href={isBootSkin ? '/bootskin' : '/apparel'} className={styles.backLink}>
            ← {isBootSkin ? '부츠스킨' : '의류'} 목록으로 돌아가기
          </Link>
          {isBootSkin && (
            <Link href="/bootskin" className={styles.backLink}>
              축구화에 올려보기 →
            </Link>
          )}
        </div>

        <div className={styles.productDetail}>
          <div className={styles.imageSection}>
            <div
              className={styles.mainImage}
              ref={emblaRef}
              onClick={() => { if (window.matchMedia('(pointer: coarse)').matches) setLightboxOpen(true); }}
            >
              <div className={styles.emblaContainer}>
                {carouselImages.map((img, index) => (
                  <div className={styles.emblaSlide} key={index}>
                    <ProductImage
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      sizes="(max-width: 768px) 100vw, 600px"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
              {carouselImages.length > 1 && (
                <>
                  <button
                    className={`${styles.carouselArrow} ${styles.carouselArrowLeft} ${currentImage === 0 ? styles.carouselArrowHidden : ''}`}
                    onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                    onMouseMove={(e) => e.stopPropagation()}
                    aria-label="이전 이미지"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    className={`${styles.carouselArrow} ${styles.carouselArrowRight} ${currentImage === carouselImages.length - 1 ? styles.carouselArrowHidden : ''}`}
                    onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                    onMouseMove={(e) => e.stopPropagation()}
                    aria-label="다음 이미지"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className={styles.dotRow}>
              {carouselImages.map((_, index) => (
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
                {carouselImages.map((img, index) => (
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

            {product.detailBanners && product.detailBanners.length > 0 && (
              <div className={styles.detailBannerDesktop}>
                <DetailBannerImage
                  src={product.detailBanners[0]}
                  alt={`${product.name} 상세 이미지 1`}
                />
                {product.detailBanners.length > 1 && (
                  <>
                    <div className={`${styles.detailBannerRest} ${!bannerExpanded ? styles.collapsed : ''}`}>
                      {product.detailBanners.slice(1).map((src, i) => (
                        <DetailBannerImage
                          key={i + 1}
                          src={src}
                          alt={`${product.name} 상세 이미지 ${i + 2}`}
                        />
                      ))}
                      {!bannerExpanded && <div className={styles.detailBannerFade} />}
                    </div>
                    <button
                      className={styles.detailBannerToggle}
                      onClick={() => setBannerExpanded((v) => !v)}
                    >
                      {bannerExpanded ? '상세 이미지 접기' : '상세 이미지 더 보기'}
                      <span className={`${styles.detailBannerToggleIcon} ${bannerExpanded ? styles.rotated : ''}`}>
                        ∨
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{productName}</h1>
            {product.category === 'boot-skin' && (
              <span className={styles.quantityBadge}>2개입 / 2pcs</span>
            )}

            <div className={styles.priceSection}>
              {price !== undefined ? (
                <>
                  <span className={styles.price}>₩{price.toLocaleString()}</span>
                  {originalPrice && originalPrice > price && (
                    <>
                      <span className={styles.originalPrice}>
                        ₩{originalPrice.toLocaleString()}
                      </span>
                      <span className={styles.discountBadge}>
                        {getDiscountPercent(price, originalPrice)}%
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className={styles.price}>—</span>
              )}
            </div>
            {price !== undefined && product.setParts && (
              <p className={styles.setPriceBreakdown}>
                {product.setParts.map((part, i) => (
                  <span key={part.label}>
                    {i > 0 && ' + '}
                    {part.label} ₩{part.price.toLocaleString()}
                    {part.originalPrice && (
                      <s> ₩{part.originalPrice.toLocaleString()}</s>
                    )}
                  </span>
                ))}
              </p>
            )}

            {product.category === 'taping' ? (
              <div className={styles.sizeChartInline}>
                <table className={styles.sizeTable}>
                  <thead>
                    <tr><th>소재</th><th>규격</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{product.details.material.split('. ')[0]}</td>
                      <td>{product.details.material.split('. ')[1]?.replace(/\.$/, '')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {product.category !== 'taping' && product.sizeChart.length > 0 && <div className={styles.sizeChartInline}>
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

            {product.setParts && (
              <div className={styles.setPartSelector}>
                <h3>구성 선택</h3>
                <div className={styles.setPartOptions}>
                  {product.setParts.map((part, idx) => (
                    <button
                      key={part.label}
                      className={`${styles.setPartButton} ${selectedPartIdx === idx ? styles.setPartButtonActive : ''}`}
                      onClick={() => handlePartSelect(idx)}
                    >
                      <img src={part.image} alt={part.label} />
                      <span>{part.label}</span>
                    </button>
                  ))}
                </div>
                {(() => {
                  const part = product.setParts![selectedPartIdx];
                  if (!part || part.sizeChart.length === 0) return null;
                  return (
                    <div className={styles.sizeChartInline}>
                      <p className={styles.sizeUnit}>단위: cm</p>
                      <table className={styles.sizeTable}>
                        {part.sizeChartType === 'shorts' ? (
                          <>
                            <thead>
                              <tr>
                                <th>사이즈</th><th>총장</th><th>허리단면</th>
                                {part.sizeChart.some((r) => r.hip !== undefined) && <th>엉덩이단면</th>}
                                {part.sizeChart.some((r) => r.hem !== undefined) && <th>밑단단면</th>}
                                {part.sizeChart.some((r) => r.recommendedWeight !== undefined) && <th>권장체중(kg)</th>}
                                {part.sizeChart.some((r) => r.recommendedHeight !== undefined) && <th>권장신장(cm)</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {part.sizeChart.map((row) => (
                                <tr key={row.size}>
                                  <td>{row.size}</td><td>{row.length}</td><td>{row.waist ?? '—'}</td>
                                  {part.sizeChart.some((r) => r.hip !== undefined) && <td>{row.hip ?? '—'}</td>}
                                  {part.sizeChart.some((r) => r.hem !== undefined) && <td>{row.hem ?? '—'}</td>}
                                  {part.sizeChart.some((r) => r.recommendedWeight !== undefined) && <td>{row.recommendedWeight ?? '—'}</td>}
                                  {part.sizeChart.some((r) => r.recommendedHeight !== undefined) && <td>{row.recommendedHeight ?? '—'}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </>
                        ) : (
                          <>
                            <thead>
                              <tr>
                                <th>사이즈</th><th>총장</th><th>가슴단면</th>
                                {part.sizeChart.some((r) => r.shoulder !== undefined) && <th>어깨너비</th>}
                                <th>소매길이</th>
                                {part.sizeChart.some((r) => r.recommendedWeight !== undefined) && <th>권장체중(kg)</th>}
                                {part.sizeChart.some((r) => r.recommendedHeight !== undefined) && <th>권장신장(cm)</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {part.sizeChart.map((row) => (
                                <tr key={row.size}>
                                  <td>{row.size}</td><td>{row.length}</td><td>{row.chest ?? '—'}</td>
                                  {part.sizeChart.some((r) => r.shoulder !== undefined) && <td>{row.shoulder ?? '—'}</td>}
                                  <td>{row.sleeve ?? '—'}</td>
                                  {part.sizeChart.some((r) => r.recommendedWeight !== undefined) && <td>{row.recommendedWeight ?? '—'}</td>}
                                  {part.sizeChart.some((r) => r.recommendedHeight !== undefined) && <td>{row.recommendedHeight ?? '—'}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                      <p className={styles.sizeDisclaimer}>
                        오버핏 제품입니다. 깔끔한 핏을 원하시면 한 사이즈 다운 권장. 측정 방법에 따라 1–3cm 오차가 발생할 수 있습니다.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {isComingSoon ? (
              <div className={styles.comingSoonNotice}>
                <span className={styles.comingSoonNoticeBadge}>COMING SOON</span>
                <p>해당 상품은 현재 출시 준비 중입니다.</p>
                <p>출시 소식은 인스타그램을 통해 먼저 확인하세요.</p>
              </div>
            ) : (
              <>
                {product.setParts && (
                  <>
                    {product.setParts.map((part, idx) => (
                      <div key={part.label} className={styles.sizeSection}>
                        <h3>{part.label} 사이즈</h3>
                        <div className={styles.sizeOptions}>
                          {part.sizes.map((size) => {
                            const isSelected = idx === 0 ? selectedTopSize === size : selectedBottomSize === size;
                            return (
                              <button
                                key={size}
                                className={`${styles.sizeButton} ${isSelected ? styles.selected : ''}`}
                                onClick={() => idx === 0 ? setSelectedTopSize(size) : setSelectedBottomSize(size)}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {/* multiSelect(부츠스킨)는 색상선택을 번호선택 아래에 배치 */}
                {!product.multiSelect && colorSection}
                {product.sizes.length >= 1 && <div className={styles.sizeSection}>
                  <h3>{product.sizeLabel ?? '사이즈 선택'}</h3>
                  <div className={`${styles.sizeOptions} ${product.category === 'boot-skin' ? styles.sizeOptionsBootSkin : ''}`}>
                    {product.sizes.map((size) => {
                      const coloredSize = selectedColor ? `${size} — ${selectedColor.name}` : size;
                      // multiSelect + colors: 선택값에 색상 포함해 저장 (색상 없으면 coloredSize === size)
                      const selectValue = product.multiSelect ? coloredSize : size;
                      const key = `${product.id}-${coloredSize}`;
                      const sizeStatus = sizeStatuses[key] || 'available';
                      const stock = sizeStocks[key] ?? null;
                      const isSoldOut = sizeStatus === 'sold_out';
                      const isDelayed = sizeStatus === 'delayed';
                      const delayText = sizeDelayTexts[key] || '지연배송';
                      const showLowStock = !isSoldOut && stock !== null && stock > 0 && stock <= 5;
                      return (
                        <button
                          key={size}
                          className={`${styles.sizeButton} ${product.category === 'boot-skin' ? styles.sizeButtonBootSkin : ''} ${product.multiSelect ? (selectedSizes.includes(selectValue) ? styles.selected : '') : (selectedSize === size ? styles.selected : '')
                            } ${isSoldOut ? styles.soldOut : ''} ${isDelayed ? styles.delayed : ''}`}
                          onClick={() => {
                            if (isSoldOut) return;
                            if (isDelayed) {
                              if (confirm(`${delayText}\n주문하시겠습니까?`)) {
                                handleSizeSelect(selectValue);
                              }
                              return;
                            }
                            handleSizeSelect(selectValue);
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
                </div>}
                {product.multiSelect && colorSection}

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
                      {isBulkCategory ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          className={styles.quantityInput}
                          value={quantityInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setQuantityInput(raw);
                            const n = parseInt(raw, 10);
                            if (!isNaN(n) && n >= 1) {
                              const coloredSz = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
                              const key = `${product.id}-${coloredSz}`;
                              const stock = (!product.multiSelect && selectedSize) ? (sizeStocks[key] || Infinity) : Infinity;
                              setQuantity(Math.min(n, stock));
                            }
                          }}
                          onBlur={() => {
                            const n = parseInt(quantityInput, 10);
                            if (!quantityInput || isNaN(n) || n < 1) {
                              setQuantity(1);
                              setQuantityInput('1');
                            }
                          }}
                        />
                      ) : (
                        <span className={styles.quantity}>{quantity}</span>
                      )}
                      <button
                        className={styles.quantityButton}
                        onClick={() => {
                          const coloredSz = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
                          const key = `${product.id}-${coloredSz}`;
                          const stock = (!product.multiSelect && selectedSize) ? (sizeStocks[key] || Infinity) : Infinity;
                          setQuantity(Math.min(quantity + 1, stock));
                        }}
                      >
                        +
                      </button>
                    </div>
                    {(() => {
                      if (product.multiSelect || !selectedSize) return null;
                      const coloredSz = selectedColor ? `${selectedSize} — ${selectedColor.name}` : selectedSize;
                      const key = `${product.id}-${coloredSz}`;
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
                    disabled={showSuccess || price === undefined}
                  >
                    {showSuccess ? '장바구니에 추가됨 ✓' : '장바구니에 추가'}
                  </button>
                  <button className={styles.buyNowButton} onClick={handleBuyNow} disabled={price === undefined}>
                    바로 구매하기
                  </button>
                </div>
                {product.category === 'set' && (
                  <div className={styles.freeShippingBanner}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    SET 구매 시 무료배송
                  </div>
                )}
                {product.category !== 'taping' && product.category !== 'socks' && product.category !== 'boot-skin' && product.category !== 'set' &&
                  product.slug !== 'quarter-zip-flex-blue' && product.slug !== 'quarter-zip-flex-light-green' && (
                    <button className={styles.logoInquiryButton} onClick={() => setLogoInquiryOpen(true)}>
                      맞춤 로고각인 가능
                    </button>
                  )}
                {(product.category === 'taping' || product.category === 'socks' || product.category === 'boot-skin') && (
                  <button className={styles.bulkInquiryButton} onClick={() => setBulkInquiryOpen(true)}>
                    {product.category === 'taping' ? '대량주문 문의' : '커스텀 주문 문의'}
                  </button>
                )}
                <p className={styles.returnNotice}>12시 이전 결제 시 당일 발송</p>
              </>
            )}

            {product.category !== 'taping' && product.category !== 'boot-skin' && (
              <div className={styles.careSection}>
                {CARE_INSTRUCTIONS.map((instruction, i) => (
                  <span key={i} className={styles.careTag}>{instruction}</span>
                ))}
              </div>
            )}

            <div className={styles.featureChips}>
              {product.features.map((f, i) => (
                <span key={i} className={styles.featureChip}>{f.label}</span>
              ))}
            </div>

            {product.detailBanners && product.detailBanners.length > 0 && (
              <div className={styles.detailBannerMobile}>
                <DetailBannerImage
                  src={product.detailBanners[0]}
                  alt={`${product.name} 상세 이미지 1`}
                />
                {product.detailBanners.length > 1 && (
                  <>
                    <div className={`${styles.detailBannerRest} ${!bannerExpanded ? styles.collapsed : ''}`}>
                      {product.detailBanners.slice(1).map((src, i) => (
                        <DetailBannerImage
                          key={i + 1}
                          src={src}
                          alt={`${product.name} 상세 이미지 ${i + 2}`}
                        />
                      ))}
                      {!bannerExpanded && <div className={styles.detailBannerFade} />}
                    </div>
                    <button
                      className={styles.detailBannerToggle}
                      onClick={() => setBannerExpanded((v) => !v)}
                    >
                      {bannerExpanded ? '상세 이미지 접기' : '상세 이미지 더 보기'}
                      <span className={`${styles.detailBannerToggleIcon} ${bannerExpanded ? styles.rotated : ''}`}>
                        ∨
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}

            {product.beforeAfterImages && (
              <BeforeAfterSlider
                before={product.beforeAfterImages.before}
                after={product.beforeAfterImages.after}
              />
            )}

            <div className={styles.accordionGroup}>
              {product.category === 'boot-skin' && (
                <Accordion title="자주 묻는 질문 (FAQ)" defaultOpen={true}>
                  <div className={styles.faqList}>
                    {BOOTSKIN_FAQ.map((item) => (
                      <div key={item.q} className={styles.faqItem}>
                        <p className={styles.faqQuestion}>Q. {item.q}</p>
                        <p className={styles.faqAnswer}>{renderFaqAnswer(item.a)}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}
              <Accordion title="제품 설명" defaultOpen={true}>
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

              {product.category !== 'taping' && product.category !== 'boot-skin' && !product.setParts && <Accordion title="사이즈 가이드">
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
              </Accordion>}

              <Accordion title="배송">
                <div className={styles.accordionContent}>
                  <ul>
                    <li>배송비: ₩{SHIPPING.fee.toLocaleString()} (주문당 1회 청구)</li>
                    <li>₩{SHIPPING.freeThreshold.toLocaleString()} 이상 구매 시 무료배송</li>
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

        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          initialReviews={initialReviews}
          initialAvgRating={initialAvgRating}
          initialCount={initialReviewCount}
        />

        {(() => {
          const related = Object.values(products)
            .filter((p) => !p.hideFromList && p.slug !== product.slug)
            .sort((a, b) => {
              const aScore =
                (a.comingSoon ? 2 : 0) + (a.category === product.category ? 0 : 1);
              const bScore =
                (b.comingSoon ? 2 : 0) + (b.category === product.category ? 0 : 1);
              return aScore - bScore;
            })
            .slice(0, 4);
          if (related.length === 0) return null;
          return (
            <div className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>관련 상품</h2>
              <div className={styles.relatedGrid}>
                {related.map((p) => (
                  <a key={p.slug} href={getProductHref(p)} className={styles.relatedCard}>
                    <div className={styles.relatedImageWrap}>
                      <ProductImage src={p.image} alt={p.name} className={styles.relatedImage} sizes="(max-width: 768px) 45vw, 200px" />
                      {p.comingSoon && (
                        <span className={styles.relatedComingSoonBadge}>COMING SOON</span>
                      )}
                    </div>
                    <p className={styles.relatedName}>{p.name}</p>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {!isComingSoon && (
        <div className={styles.stickyBuyBar}>
          <div className={styles.stickyBuyBarInner}>
            <div className={styles.stickyBuyBarInfo}>
              <span className={styles.stickyBuyBarPrice}>{price !== undefined ? `₩${price.toLocaleString()}` : '—'}</span>
              {product.sizes.length > 1 && (
                <span className={styles.stickyBuyBarSize}>
                  {product.multiSelect
                    ? (selectedSizes.length > 0 ? `선택: ${selectedSizes.join(', ')}` : '선택하세요')
                    : (selectedSize ? `사이즈: ${selectedSize}` : '사이즈를 선택하세요')}
                </span>
              )}
            </div>
            <div className={styles.stickyBuyBarActions}>
              <button
                className={styles.stickyCartButton}
                onClick={handleAddToCart}
                disabled={showSuccess || price === undefined}
              >
                {showSuccess ? '✓' : '장바구니'}
              </button>
              <button className={styles.stickyBuyButton} onClick={handleBuyNow} disabled={price === undefined}>
                바로 구매
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkInquiryOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setBulkInquiryOpen(false)}>
          <div className={styles.logoInquiryModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setBulkInquiryOpen(false)}>✕</button>
            <h3 className={styles.logoInquiryTitle}>{product.category === 'taping' ? '대량주문 문의' : '커스텀 주문 문의'}</h3>
            <p className={styles.logoInquiryDesc}>
              {product.category === 'taping'
                ? '대량 주문 문의는 메일 혹은 인스타그램 DM으로 연락 부탁드립니다.'
                : '팀 로고 및 이외 커스텀 주문 제작은 메일 혹은 인스타그램 DM으로 문의 부탁드립니다.'}
            </p>
            <div className={styles.logoInquiryContacts}>
              <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>Instagram DM</span>
                <span className={styles.logoInquiryContactValue}>@team.brospick</span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>이메일</span>
                <span className={styles.logoInquiryContactValue}>{CONTACT.email}</span>
              </a>
              <a href={`tel:${CONTACT.phone}`} className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>전화 / 문자</span>
                <span className={styles.logoInquiryContactValue}>{CONTACT.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {logoInquiryOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setLogoInquiryOpen(false)}>
          <div className={styles.logoInquiryModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLogoInquiryOpen(false)}>✕</button>
            <h3 className={styles.logoInquiryTitle}>맞춤 로고각인 단체 주문</h3>
            <p className={styles.logoInquiryDesc}>
              팀, 단체, 기업 유니폼에 로고각인을 원하신다면 편하게 연락 주세요.<br />
              수량, 디자인, 납기까지 처음부터 끝까지 함께 도와드립니다.
            </p>
            <div className={styles.logoInquiryContacts}>
              <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>Instagram DM</span>
                <span className={styles.logoInquiryContactValue}>@team.brospick</span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>이메일</span>
                <span className={styles.logoInquiryContactValue}>{CONTACT.email}</span>
              </a>
              <a href={`tel:${CONTACT.phone}`} className={styles.logoInquiryContact}>
                <span className={styles.logoInquiryContactLabel}>전화 / 문자</span>
                <span className={styles.logoInquiryContactValue}>{CONTACT.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)}>✕</button>
          <img
            src={carouselImages[currentImage]}
            alt={product.name}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
