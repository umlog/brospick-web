'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './product-detail.module.css';

/** 손을 떼고 나서 머무는 기본 위치 — 양쪽을 반씩 보여줘 드래그가 가능하다는 걸 알린다 */
const NEUTRAL_POS = 50;
/** AFTER를 왼쪽부터 훑어 채우는 시간 (부츠스킨이 그려지는 구간) */
const REVEAL_MS = 1100;
/** 다 채운 뒤 기본 위치로 되돌아오는 시간 */
const SETTLE_MS = 500;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
  /** 화면에 들어올 때 한 번 자동으로 훑어 보여준다 */
  autoPlayOnView?: boolean;
  /** 손잡이 아래에 뜨는 안내 문구 — 처음 만지면 사라진다 */
  hint?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = '',
  afterLabel = '',
  height = 320,
  autoPlayOnView = false,
  hint = '',
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(autoPlayOnView ? 0 : NEUTRAL_POS);
  const [interacted, setInteracted] = useState(false);
  // 자동 재생 중에는 손잡이가 이미 움직이고 있으니 신호를 겹치지 않는다
  const [hintReady, setHintReady] = useState(!autoPlayOnView);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const showHint = hintReady && !interacted;

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    setInteracted(true);
    updatePos(e.clientX);
  }, [updatePos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    setInteracted(true);
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

  // 화면에 들어오면 한 번 훑어서 부츠스킨이 그려지는 과정을 보여준다.
  // 사용자가 손잡이를 잡으면 즉시 양보하고 멈춘다.
  useEffect(() => {
    const el = containerRef.current;
    if (!autoPlayOnView || !el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPos(NEUTRAL_POS);
      setHintReady(true);
      return;
    }

    let raf = 0;
    let startedAt = 0;

    const step = (now: number) => {
      if (dragging.current) return;
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;

      if (elapsed <= REVEAL_MS) {
        setPos(easeOutCubic(elapsed / REVEAL_MS) * 100);
      } else if (elapsed <= REVEAL_MS + SETTLE_MS) {
        const t = easeOutCubic((elapsed - REVEAL_MS) / SETTLE_MS);
        setPos(100 - (100 - NEUTRAL_POS) * t);
      } else {
        setPos(NEUTRAL_POS);
        setHintReady(true);
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [autoPlayOnView]);

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
        <div className={`${styles.beforeAfterKnob} ${showHint ? styles.beforeAfterKnobHint : ''}`}>
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

      {hint && (
        <span className={`${styles.beforeAfterHint} ${showHint ? '' : styles.beforeAfterHintGone}`}>
          {hint}
        </span>
      )}
    </div>
  );
}
