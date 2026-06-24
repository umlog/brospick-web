'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './SitePopup.module.css';
import type { SitePopupData } from '@/lib/site-content';

interface Props {
  initialPopup: SitePopupData | null;
}

export function SitePopup({ initialPopup }: Props) {
  const popup = initialPopup;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!popup) return;
    // show_once: 세션 닫음 또는 "오늘 하루 보지 않기" 처리
    if (popup.show_once) {
      if (sessionStorage.getItem(`popup_dismissed_${popup.id}`)) return;
      if (localStorage.getItem(`popup_today_${popup.id}`) === new Date().toDateString()) return;
    }
    setVisible(true);
  }, [popup]);

  const close = () => {
    if (popup?.show_once) {
      sessionStorage.setItem(`popup_dismissed_${popup.id}`, '1');
    }
    setVisible(false);
  };

  const dismissToday = () => {
    if (popup?.show_once) {
      localStorage.setItem(`popup_today_${popup.id}`, new Date().toDateString());
    }
    setVisible(false);
  };

  if (!visible || !popup) return null;

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="닫기">✕</button>

        {popup.image_url && (
          popup.link_url ? (
            <Link href={popup.link_url} onClick={close}>
              <img src={popup.image_url} alt={popup.title} className={styles.image} />
            </Link>
          ) : (
            <img src={popup.image_url} alt={popup.title} className={styles.image} />
          )
        )}

        <div className={styles.body}>
          <h3 className={styles.title}>{popup.title}</h3>
          <div className={styles.content}>
            {popup.content.split('\n').map((line, i) => {
              const iconMatch = line.match(/^\[icon:([^\]]+)\]\s*/);
              if (iconMatch) {
                const rest = line.slice(iconMatch[0].length);
                const parts = rest.split(/\*\*(.+?)\*\*/g);
                return (
                  <span key={i} className={styles.contentRow}>
                    <span className={`material-symbols-outlined ${styles.contentIcon}`}>{iconMatch[1]}</span>
                    <span>
                      {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                    </span>
                  </span>
                );
              }
              const parts = line.split(/\*\*(.+?)\*\*/g);
              return (
                <span key={i}>
                  {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                  {'\n'}
                </span>
              );
            })}
          </div>
          {popup.link_url && (
            <Link href={popup.link_url} className={styles.linkBtn} onClick={close}>
              자세히 보기
            </Link>
          )}
        </div>

        {popup.show_once && (
          <div className={styles.footer}>
            <button className={styles.dismissBtn} onClick={dismissToday}>
              오늘 하루 보지 않기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
