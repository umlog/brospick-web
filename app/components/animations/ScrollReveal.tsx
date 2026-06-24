'use client';

import { useRef, useEffect, useState, ReactNode, CSSProperties } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  className?: string;
}

// framer-motion 제거: IntersectionObserver + CSS transition으로 동일 동작 구현.
const HIDDEN_TRANSFORM: Record<NonNullable<ScrollRevealProps['direction']>, string> = {
  up: 'translateY(60px)',
  down: 'translateY(-60px)',
  left: 'translateX(60px)',
  right: 'translateX(-60px)',
  fade: 'none',
};

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    // framer-motion useInView({ once: true, margin: '-100px' })와 동일하게
    // 뷰포트 안으로 100px 들어왔을 때 1회 트리거.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : HIDDEN_TRANSFORM[direction],
    transition: `opacity ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s, transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
