'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './product-detail.module.css';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = '',
  afterLabel = '',
  height = 320,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    updatePos(e.clientX);
  }, [updatePos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    updatePos(e.touches[0].clientX);
  }, [updatePos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      updatePos(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      updatePos(e.touches[0].clientX);
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updatePos]);

  return (
    <div
      ref={containerRef}
      className={styles.beforeAfterContainer}
      style={{ height }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* BEFORE — right side, clipped from left */}
      <img
        src={before}
        alt={beforeLabel}
        className={styles.beforeAfterImg}
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        draggable={false}
      />

      {/* AFTER — left side, clipped from right */}
      <img
        src={after}
        alt={afterLabel}
        className={styles.beforeAfterImg}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      {/* Divider line + handle */}
      <div className={styles.beforeAfterHandle} style={{ left: `${pos}%` }}>
        <div className={styles.beforeAfterLine} />
        <div className={styles.beforeAfterKnob}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      {afterLabel && <span className={`${styles.beforeAfterLabel} ${styles.beforeAfterLabelAfter}`}>{afterLabel}</span>}
      {beforeLabel && <span className={`${styles.beforeAfterLabel} ${styles.beforeAfterLabelBefore}`}>{beforeLabel}</span>}
    </div>
  );
}
