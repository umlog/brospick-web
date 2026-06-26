'use client';

import { useEffect, useState } from 'react';
import styles from './scroll-progress.module.css';

// 페이지 상단 고정 스크롤 진행 게이지. 헤더 바로 아래에 얇게 표시된다.
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
