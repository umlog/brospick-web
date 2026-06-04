'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './review-lightbox.module.css';

interface ReviewLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ReviewLightbox({ images, initialIndex, onClose }: ReviewLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    const prev_overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev_overflow;
    };
  }, [current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      dx > 0 ? next() : prev();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 닫기 */}
      <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>

      {/* 카운터 */}
      <div className={styles.counter}>{current + 1} / {images.length}</div>

      {/* 이미지 */}
      <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={`리뷰 이미지 ${current + 1}`}
          className={styles.image}
          draggable={false}
        />
      </div>

      {/* 좌우 화살표 */}
      {images.length > 1 && (
        <>
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="이전"
          >
            ‹
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="다음"
          >
            ›
          </button>
        </>
      )}

      {/* 썸네일 스트립 */}
      {images.length > 1 && (
        <div className={styles.thumbStrip} onClick={(e) => e.stopPropagation()}>
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
              onClick={() => setCurrent(i)}
              draggable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
