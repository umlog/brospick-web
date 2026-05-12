'use client';

import { useEffect, useState } from 'react';
import styles from './scroll-hint.module.css';

export default function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`${styles.wrap} ${visible ? styles.visible : styles.hidden}`} aria-hidden="true">
      <span className={styles.line} />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 6.5l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
