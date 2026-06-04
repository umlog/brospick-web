'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { showConfirm } from '../lib/confirm';
import { showToast } from '../lib/toast';

interface AdminReview {
  id: string;
  rating: number;
  content: string;
  reviewer_name: string;
  created_at: string;
  images: string[];
  height: number | null;
  usual_size: string | null;
  helpful_count: number;
  product_id: number;
  product_name: string;
  size: string;
}

const STAR_FILTERS = [0, 5, 4, 3, 2, 1] as const;

export function ReviewManager() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (res.ok) setReviews(data.reviews);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: AdminReview) => {
    const confirmed = await showConfirm(
      `"${review.reviewer_name}"님의 리뷰를 삭제하시겠습니까?\n${review.product_name} · ${review.size}`
    );
    if (!confirmed) return;

    setDeleting(review.id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        showToast('리뷰가 삭제되었습니다.');
      } else {
        showToast('삭제에 실패했습니다.');
      }
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (str: string) => {
    const d = new Date(str);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const filtered = reviews.filter((r) => {
    if (starFilter !== 0 && r.rating !== starFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.product_name.toLowerCase().includes(q) ||
        r.reviewer_name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <p className={styles.loading}>불러오는 중...</p>;

  return (
    <div>
      {/* 통계 요약 */}
      <div className={styles.reviewStats}>
        <span className={styles.reviewStatItem}>전체 <strong>{reviews.length}</strong>건</span>
        {[5, 4, 3, 2, 1].map((star) => {
          const cnt = reviews.filter((r) => r.rating === star).length;
          if (cnt === 0) return null;
          return (
            <span key={star} className={styles.reviewStatItem}>
              {'★'.repeat(star)} <strong>{cnt}</strong>
            </span>
          );
        })}
      </div>

      {/* 필터 */}
      <div className={styles.filters}>
        <input
          className={styles.input}
          type="text"
          placeholder="상품명, 작성자, 내용 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {STAR_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.filterButton} ${starFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStarFilter(s)}
            >
              {s === 0 ? '전체' : '★'.repeat(s)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>조건에 맞는 리뷰가 없습니다.</p>
      ) : (
        <div className={styles.reviewList}>
          {filtered.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <div key={r.id} className={styles.reviewCard}>
                {/* 메타 행 */}
                <div className={styles.reviewCardHeader}>
                  <div className={styles.reviewCardLeft}>
                    <span className={styles.reviewProductName}>{r.product_name}</span>
                    {r.size && <span className={styles.reviewSizeBadge}>{r.size}</span>}
                    <span style={{ color: '#f5a623', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <div className={styles.reviewCardRight}>
                    <span className={styles.reviewMeta}>{r.reviewer_name.slice(0, 1)}**</span>
                    {(r.height || r.usual_size) && (
                      <span className={styles.reviewMeta}>
                        {r.height ? `${r.height}cm` : ''}{r.height && r.usual_size ? ' · ' : ''}{r.usual_size ? `평소 ${r.usual_size}` : ''}
                      </span>
                    )}
                    {r.helpful_count > 0 && (
                      <span className={styles.reviewMeta}>👍 {r.helpful_count}</span>
                    )}
                    {r.images.length > 0 && (
                      <span className={styles.reviewMeta}>📷 {r.images.length}</span>
                    )}
                    <span className={styles.reviewMeta}>{formatDate(r.created_at)}</span>
                  </div>
                </div>

                {/* 내용 */}
                <p
                  className={styles.reviewContent}
                  style={{ cursor: r.content.length > 100 ? 'pointer' : 'default' }}
                  onClick={() => r.content.length > 100 && setExpandedId(isExpanded ? null : r.id)}
                >
                  {isExpanded ? r.content : r.content.length > 100 ? `${r.content.slice(0, 100)}...` : r.content}
                  {r.content.length > 100 && (
                    <span className={styles.reviewExpandHint}> {isExpanded ? '접기' : '더보기'}</span>
                  )}
                </p>

                {/* 이미지 */}
                {r.images.length > 0 && (
                  <div className={styles.reviewImages}>
                    {r.images.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className={styles.reviewThumb}
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* 액션 */}
                <div className={styles.reviewActions}>
                  <button
                    className={styles.reviewDeleteButton}
                    onClick={() => handleDelete(r)}
                    disabled={deleting === r.id}
                  >
                    {deleting === r.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
