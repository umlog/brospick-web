'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './review.module.css';
import { compressImage } from '@/lib/utils/compress-image';

interface ReviewableItem {
  id: string;
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  reviewed: boolean;
  existingReview: { rating: number; content: string; images: string[] } | null;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  items: ReviewableItem[];
}

interface ImagePreview {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl: string | null;
  error: string | null;
}

const MAX_IMAGES = 5;

function ReviewContent() {
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewableItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [height, setHeight] = useState('');
  const [usualSize, setUsualSize] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successItem, setSuccessItem] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!orderNumber) {
      const saved = localStorage.getItem('brospick-last-order');
      if (saved) setOrderNumber(saved);
    }
  }, []);

  // 이미지 객체 URL 해제
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch('/api/reviews/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error);
        return;
      }
      setOrderData(data);
    } catch {
      setLookupError('조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSelectItem = (item: ReviewableItem) => {
    if (item.reviewed) return;
    setSelectedItem(item);
    setRating(0);
    setHoverRating(0);
    setContent('');
    setHeight('');
    setUsualSize(item.size);
    setImages([]);
    setSubmitError('');
    // 모바일에서 폼이 보이도록 스크롤
    setTimeout(() => {
      const el = itemRefs.current.get(item.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: ImagePreview[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      uploadedUrl: null,
      error: null,
    }));

    setImages((prev) => [...prev, ...newPreviews]);

    // 각 파일 즉시 업로드
    toAdd.forEach(async (file) => {
      const formData = new FormData();
      const compressed = await compressImage(file);
      formData.append('file', compressed);

      try {
        const res = await fetch('/api/reviews/upload', { method: 'POST', body: formData });
        const data = await res.json();
        const uploadedUrl = res.ok ? (data.url as string) : null;
        const error = res.ok ? null : (data.error as string);

        setImages((prev) => {
          const updated = [...prev];
          const target = updated.find(
            (img) => img.file === file
          );
          if (target) {
            target.uploading = false;
            target.uploadedUrl = uploadedUrl;
            target.error = error;
          }
          return updated;
        });
      } catch {
        setImages((prev) => {
          const updated = [...prev];
          const target = updated.find((img) => img.file === file);
          if (target) {
            target.uploading = false;
            target.error = '업로드 실패';
          }
          return updated;
        });
      }
    });

    // input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!selectedItem || rating === 0 || !content.trim()) return;

    const stillUploading = images.some((img) => img.uploading);
    if (stillUploading) {
      setSubmitError('이미지 업로드 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const uploadedUrls = images
      .filter((img) => img.uploadedUrl)
      .map((img) => img.uploadedUrl as string);

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderData!.orderNumber,
          phone,
          orderItemId: selectedItem.id,
          rating,
          content,
          images: uploadedUrls,
          height: height ? parseInt(height, 10) : null,
          usual_size: usualSize || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error);
        return;
      }

      setOrderData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === selectedItem.id
                  ? { ...i, reviewed: true, existingReview: { rating, content, images: uploadedUrls } }
                  : i
              ),
            }
          : prev
      );
      setSuccessItem(selectedItem.id);
      setSelectedItem(null);
      setImages([]);
    } catch {
      setSubmitError('리뷰 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setOrderData(null);
    setSelectedItem(null);
    setOrderNumber('');
    setPhone('');
    setRating(0);
    setContent('');
    setImages([]);
    setLookupError('');
    setSuccessItem(null);
  };

  const allReviewed = orderData?.items.every((i) => i.reviewed) ?? false;

  // ─── Lookup ────────────────────────────────────────────────────────────────
  if (!orderData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>리뷰 작성</h1>
            <p>주문번호와 전화번호로 구매하신 상품에 리뷰를 남겨주세요.</p>
            <Link href="/my-reviews" className={styles.myReviewsLink}>내 리뷰 조회·수정 →</Link>
          </div>
          <form className={styles.form} onSubmit={handleLookup}>
            {lookupError && <div className={styles.error}>{lookupError}</div>}
            <div className={styles.inputGroup}>
              <label>주문번호</label>
              <input
                type="text"
                placeholder="BP-20250209-1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>주문 시 입력한 전화번호</label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={lookupLoading}>
              {lookupLoading ? '조회 중...' : '주문 조회'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Items List + Form ─────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>리뷰 작성</h1>
          <p>리뷰를 남길 상품을 선택해주세요.</p>
        </div>

        <div className={styles.orderPreview}>
          <span className={styles.orderNumber}>{orderData.orderNumber}</span>
          <span className={styles.customerName}>{orderData.customerName} 님</span>
        </div>

        <div className={styles.itemList}>
          {orderData.items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isSuccess = successItem === item.id;
            return (
              <div key={item.id} className={styles.itemWrapper} ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}>
                <button
                  className={`${styles.itemCard} ${item.reviewed ? styles.itemCardReviewed : ''} ${isSelected ? styles.itemCardSelected : ''}`}
                  onClick={() => handleSelectItem(item)}
                  disabled={item.reviewed}
                >
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.productName}</div>
                    <div className={styles.itemMeta}>{item.size} · {item.quantity}개</div>
                    {item.reviewed && item.existingReview && (
                      <div className={styles.existingRating}>
                        {'★'.repeat(item.existingReview.rating)}{'☆'.repeat(5 - item.existingReview.rating)}
                        <span className={styles.existingContent}>{item.existingReview.content}</span>
                      </div>
                    )}
                  </div>
                  {isSuccess && <span className={styles.itemBadgeNew}>작성완료</span>}
                  {item.reviewed && !isSuccess && <span className={styles.itemBadgeDone}>리뷰완료</span>}
                  {!item.reviewed && !isSelected && <span className={styles.itemBadgePending}>리뷰쓰기</span>}
                  {isSelected && <span className={styles.itemBadgeActive}>작성중</span>}
                </button>

                {isSelected && (
                  <div className={styles.reviewForm}>
                    {/* 별점 */}
                    <div className={styles.starGroup}>
                      <p className={styles.formLabel}>별점</p>
                      <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`${styles.star} ${star <= (hoverRating || rating) ? styles.starFilled : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 사이즈 정보 */}
                    <div className={styles.sizeInfoGroup}>
                      <p className={styles.formLabel}>
                        사이즈 정보 <span className={styles.optional}>선택</span>
                      </p>
                      <div className={styles.sizeInfoRow}>
                        <div className={styles.sizeInfoField}>
                          <label>키</label>
                          <div className={styles.sizeInputWrapper}>
                            <input
                              type="number"
                              placeholder="175"
                              value={height}
                              onChange={(e) => setHeight(e.target.value)}
                              min={100}
                              max={250}
                            />
                            <span className={styles.sizeUnit}>cm</span>
                          </div>
                        </div>
                        <div className={styles.sizeInfoField}>
                          <label>구매 사이즈</label>
                          <input
                            type="text"
                            value={usualSize}
                            readOnly
                            className={styles.sizeInputReadonly}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 텍스트 */}
                    <div className={styles.inputGroup} style={{ padding: '0 16px 4px' }}>
                      <textarea
                        placeholder={`예) 착용감이 편안하고 사이즈가 딱 맞았어요.\n소재가 가볍고 운동할 때 불편함이 없었습니다.\n색상도 사진과 똑같아서 만족합니다!`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* 작성 힌트 */}
                    <div className={styles.reviewHint}>
                      <p className={styles.reviewHintTitle}>이런 내용을 써보세요</p>
                      <ul className={styles.reviewHintList}>
                        <li>착용감 · 핏 (몸에 잘 맞았나요?)</li>
                        <li>소재 · 두께감 (얇다/두껍다, 부드럽다)</li>
                        <li>사이즈 (평소보다 크게/작게 구매)</li>
                        <li>실제 사용 후 변화 (세탁 후 변형, 냄새 제거 등)</li>
                      </ul>
                    </div>

                    {/* 사진 업로드 */}
                    <div className={styles.imageSection}>
                      <p className={styles.formLabel}>사진 첨부 <span className={styles.imageCount}>{images.length}/{MAX_IMAGES}</span></p>
                      <div className={styles.imagePreviews}>
                        {images.map((img, idx) => (
                          <div key={idx} className={styles.imageThumb}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.previewUrl} alt={`첨부 이미지 ${idx + 1}`} />
                            {img.uploading && (
                              <div className={styles.imageOverlay}>
                                <span className={styles.imageSpinner} />
                              </div>
                            )}
                            {img.error && (
                              <div className={styles.imageOverlayError}>
                                <span>!</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className={styles.imageRemove}
                              onClick={() => handleRemoveImage(idx)}
                              aria-label="이미지 삭제"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {images.length < MAX_IMAGES && (
                          <button
                            type="button"
                            className={styles.imageAddButton}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <span>+</span>
                            <span className={styles.imageAddLabel}>사진 추가</span>
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                      />
                    </div>

                    {submitError && (
                      <div className={styles.error} style={{ margin: '0 16px 12px' }}>
                        {submitError}
                      </div>
                    )}
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setSelectedItem(null)}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={submitLoading || rating === 0 || !content.trim() || images.some((i) => i.uploading)}
                      >
                        {submitLoading ? '등록 중...' : '리뷰 등록'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allReviewed && (
          <div className={styles.allDone}>
            <div className={styles.allDoneIcon}>✓</div>
            <p>모든 상품의 리뷰를 작성해주셨어요. 감사합니다!</p>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.resetButton} onClick={handleReset}>
            다른 주문 조회
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>로딩 중...</p>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
