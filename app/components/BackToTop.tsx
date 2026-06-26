'use client';

import { useEffect, useState } from 'react';
import styles from './back-to-top.module.css';

const SHOW_AFTER = 500; // px 스크롤 후 노출

// 일정 스크롤 이상 내려가면 우하단에 나타나는 맨 위로 가기 버튼.
// FloatingTracker(고객센터) 버튼 바로 위에 쌓인다.
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      className={`${styles.button} ${visible ? styles.show : ''}`}
      onClick={toTop}
      aria-label="맨 위로"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
