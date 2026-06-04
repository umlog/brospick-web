'use client';

import { useState, useRef, Suspense } from 'react';
import styles from './my-reviews.module.css';
import { compressImage } from '@/lib/utils/compress-image';

interface ReviewData {
  id: string;
  rating: number;
  content: string;
  images: string[];
  created_at: string;
  productName: string;
  size: string;
  height?: number | null;
  usual_size?: string | null;
}

interface ImagePreview {
  file?: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl: string | null;
  error: string | null;
}

const MAX_IMAGES = 5;

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(rating)}
      <span className={styles.starsEmpty}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function MyReviewsContent() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<ReviewData[] | null>(null);

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editUsualSize, setEditUsualSize] = useState('');
  const [editImages, setEditImages] = useState<ImagePreview[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // 삭제 확인 상태
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReviews(null);
    setEditingId(null);
    setConfirmDeleteId(null);

    try {
      const res = await fetch('/api/reviews/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setReviews(data.reviews);
    } catch {
      setError('조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: ReviewData) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditHoverRating(0);
    setEditContent(r.content);
    setEditHeight(r.height ? String(r.height) : '');
    setEditUsualSize(r.usual_size || '');
    setEditImages(
      r.images.map((url) => ({
        previewUrl: url,
        uploading: false,
        uploadedUrl: url,
        error: null,
      }))
    );
    setEditError('');
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditHeight('');
    setEditUsualSize('');
    setEditImages([]);
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - editImages.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: ImagePreview[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      uploadedUrl: null,
      error: null,
    }));

    setEditImages((prev) => [...prev, ...newPreviews]);

    toAdd.forEach(async (file) => {
      const formData = new FormData();
      const compressed = await compressImage(file);
      formData.append('file', compressed);
      try {
        const res = await fetch('/api/reviews/upload', { method: 'POST', body: formData });
        const data = await res.json();
        setEditImages((prev) =>
          prev.map((img) =>
            img.file === file
              ? { ...img, uploading: false, uploadedUrl: res.ok ? data.url : null, error: res.ok ? null : data.error }
              : img
          )
        );
      } catch {
        setEditImages((prev) =>
          prev.map((img) => (img.file === file ? { ...img, uploading: false, error: '업로드 실패' } : img))
        );
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages((prev) => {
      const img = prev[index];
      if (img.file) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveEdit = async (reviewId: string) => {
    if (editImages.some((i) => i.uploading)) {
      setEditError('이미지 업로드 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (editRating === 0 || !editContent.trim()) return;

    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch('/api/reviews/my', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          reviewId,
          rating: editRating,
          content: editContent,
          images: editImages.filter((i) => i.uploadedUrl).map((i) => i.uploadedUrl as string),
          height: editHeight ? parseInt(editHeight, 10) : null,
          usual_size: editUsualSize || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error); return; }

      setReviews((prev) =>
        prev
          ? prev.map((r) =>
              r.id === reviewId
                ? {
                    ...r,
                    rating: editRating,
                    content: editContent,
                    images: editImages.filter((i) => i.uploadedUrl).map((i) => i.uploadedUrl as string),
                    height: editHeight ? parseInt(editHeight, 10) : null,
                    usual_size: editUsualSize || null,
                  }
                : r
            )
          : prev
      );
      setEditingId(null);
      setEditImages([]);
    } catch {
      setEditError('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/reviews/my', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, reviewId }),
      });
      if (!res.ok) return;
      setReviews((prev) => prev ? prev.filter((r) => r.id !== reviewId) : prev);
      setConfirmDeleteId(null);
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (str: string) => {
    const d = new Date(str);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  // ─── Lookup form ──────────────────────────────────────────────────────────
  if (reviews === null) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>내 리뷰 조회</h1>
            <p>주문 시 입력한 전화번호로 작성한 리뷰를 확인하고 수정·삭제할 수 있습니다.</p>
          </div>
          <form className={styles.form} onSubmit={handleLookup}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <label>전화번호</label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '조회 중...' : '리뷰 조회'}
            </button>
          </form>
          <div className={styles.privacyNotice}>
            개인정보 처리방침에 따라 작성일로부터 <strong>5년이 경과한 리뷰</strong>는 조회되지 않습니다.
          </div>
        </div>
      </div>
    );
  }

  // ─── Review list ──────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>내 리뷰</h1>
          <p>{reviews.length > 0 ? `총 ${reviews.length}개의 리뷰` : '작성한 리뷰가 없습니다.'}</p>
        </div>

        {reviews.length === 0 ? (
          <div className={styles.empty}>
            <p>조회된 리뷰가 없습니다.</p>
            <p className={styles.emptyHint}>5년이 경과한 리뷰는 개인정보 보호 정책에 따라 조회되지 않습니다.</p>
          </div>
        ) : (
          <div className={styles.reviewList}>
            {reviews.map((r) => {
              const isEditing = editingId === r.id;
              const isConfirmDelete = confirmDeleteId === r.id;
              return (
                <div key={r.id} className={styles.reviewCard}>
                  <div className={styles.reviewMeta}>
                    <span className={styles.productName}>{r.productName}</span>
                    {r.size && <span className={styles.size}>{r.size}</span>}
                    <span className={styles.date}>{formatDate(r.created_at)}</span>
                  </div>

                  {isEditing ? (
                    /* ── 수정 폼 ─────────────────────────── */
                    <div className={styles.editForm}>
                      <div className={styles.starGroup}>
                        <p className={styles.formLabel}>별점</p>
                        <div className={styles.starRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`${styles.star} ${star <= (editHoverRating || editRating) ? styles.starFilled : ''}`}
                              onClick={() => setEditRating(star)}
                              onMouseEnter={() => setEditHoverRating(star)}
                              onMouseLeave={() => setEditHoverRating(0)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className={styles.textarea}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                      />

                      {/* 사이즈 정보 수정 */}
                      <div>
                        <p className={styles.formLabel}>
                          사이즈 정보 <span className={styles.imageCount}>선택</span>
                        </p>
                        <div className={styles.sizeInfoRow}>
                          <div className={styles.sizeInfoField}>
                            <label className={styles.formLabel}>키</label>
                            <div className={styles.sizeInputWrapper}>
                              <input
                                className={styles.sizeInput}
                                type="number"
                                placeholder="175"
                                value={editHeight}
                                onChange={(e) => setEditHeight(e.target.value)}
                                min={100}
                                max={250}
                              />
                              <span className={styles.sizeUnit}>cm</span>
                            </div>
                          </div>
                          <div className={styles.sizeInfoField}>
                            <label className={styles.formLabel}>평소 사이즈</label>
                            <input
                              className={styles.sizeInput}
                              type="text"
                              placeholder="M"
                              value={editUsualSize}
                              onChange={(e) => setEditUsualSize(e.target.value)}
                              maxLength={10}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 이미지 수정 */}
                      <div className={styles.imageSection}>
                        <p className={styles.formLabel}>사진 <span className={styles.imageCount}>{editImages.length}/{MAX_IMAGES}</span></p>
                        <div className={styles.imagePreviews}>
                          {editImages.map((img, idx) => (
                            <div key={idx} className={styles.imageThumb}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.previewUrl} alt="" />
                              {img.uploading && <div className={styles.imageOverlay}><span className={styles.spinner} /></div>}
                              {img.error && <div className={styles.imageOverlayError}>!</div>}
                              <button type="button" className={styles.imageRemove} onClick={() => handleRemoveEditImage(idx)}>×</button>
                            </div>
                          ))}
                          {editImages.length < MAX_IMAGES && (
                            <button type="button" className={styles.imageAddButton} onClick={() => fileInputRef.current?.click()}>
                              <span>+</span>
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                          multiple
                          style={{ display: 'none' }}
                          onChange={handleEditImageSelect}
                        />
                      </div>

                      {editError && <div className={styles.error}>{editError}</div>}
                      <div className={styles.editActions}>
                        <button type="button" className={styles.cancelButton} onClick={cancelEdit}>취소</button>
                        <button
                          type="button"
                          className={styles.saveButton}
                          onClick={() => handleSaveEdit(r.id)}
                          disabled={editLoading || editRating === 0 || !editContent.trim() || editImages.some((i) => i.uploading)}
                        >
                          {editLoading ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 리뷰 내용 ───────────────────────── */
                    <>
                      <StarDisplay rating={r.rating} />
                      {(r.height || r.usual_size) && (
                        <p className={styles.sizeInfo}>
                          {r.height && `키 ${r.height}cm`}
                          {r.height && r.usual_size && ' · '}
                          {r.usual_size && `평소 ${r.usual_size}`}
                        </p>
                      )}
                      {r.images.length > 0 && (
                        <div className={styles.reviewImages}>
                          {r.images.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={url} alt="" className={styles.reviewImage} />
                          ))}
                        </div>
                      )}
                      <p className={styles.reviewContent}>{r.content}</p>

                      {isConfirmDelete ? (
                        <div className={styles.deleteConfirm}>
                          <span>정말 삭제하시겠습니까?</span>
                          <div className={styles.deleteConfirmActions}>
                            <button className={styles.cancelButton} onClick={() => setConfirmDeleteId(null)}>취소</button>
                            <button
                              className={styles.deleteConfirmButton}
                              onClick={() => handleDelete(r.id)}
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.actions}>
                          <button className={styles.editButton} onClick={() => startEdit(r)}>수정</button>
                          <button className={styles.deleteButton} onClick={() => setConfirmDeleteId(r.id)}>삭제</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.resetButton} onClick={() => { setReviews(null); setPhone(''); }}>
            다시 조회
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>로딩 중...</p>
      </div>
    }>
      <MyReviewsContent />
    </Suspense>
  );
}
