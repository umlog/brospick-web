'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTACT } from '../../lib/constants';
import styles from './FloatingTracker.module.css';

const HIDDEN_PATHS = ['/checkout', '/cart'];
const HIDDEN_PATTERN = /^\/apparel\/.+/;

export default function FloatingTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) return null;
  if (pathname && HIDDEN_PATTERN.test(pathname)) return null;

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <p className={styles.headerBrand}>BROSPICK</p>
              <p className={styles.headerSub}>무엇을 도와드릴까요?</p>
            </div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={styles.menuList}>
            <Link href="/tracking" className={styles.menuCard} onClick={() => setIsOpen(false)}>
              <div className={styles.menuIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12H19M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>주문 조회</span>
                <span className={styles.menuSub}>배송 현황 확인하기</span>
              </div>
              <svg className={styles.menuArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>

            <Link href="/returns" className={styles.menuCard} onClick={() => setIsOpen(false)}>
              <div className={styles.menuIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 14L4 9l5-5" />
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
                </svg>
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>취소 / 교환 / 반품</span>
                <span className={styles.menuSub}>배송 전 취소 · 수령 후 7일 이내 교환/반품</span>
              </div>
              <svg className={styles.menuArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>

            <a href={`mailto:${CONTACT.email}`} className={styles.menuCard}>
              <div className={styles.menuIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </div>
              <div className={styles.menuText}>
                <span className={styles.menuTitle}>단체주문 문의</span>
                <span className={styles.menuSub}>이메일로 문의하기</span>
              </div>
              <svg className={styles.menuArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </div>

          <div className={styles.panelFooter}>
            <span>{CONTACT.phone}</span>
          </div>
        </div>
      )}

      <button
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="고객센터"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
