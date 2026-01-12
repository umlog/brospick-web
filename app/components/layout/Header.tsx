'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './header.module.css';
import symbolImg from '../../styles/symbol.svg';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: '의류', href: '/apparel-showcase' },
    { label: '팀브로스픽', href: '/#manifesto' },
    { label: '블로그', href: '/interviews' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src={symbolImg}
            alt="Brospick"
            className={styles.logoImage}
            priority
          />
        </Link>

        <nav className={styles.navDesktop}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="테마 전환"
          >
            <div className={styles.toggleTrack}>
              <div className={`${styles.toggleThumb} ${theme === 'dark' ? styles.toggleThumbDark : ''}`}>
                {theme === 'dark' ? (
                  <svg className={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg className={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </div>
            </div>
          </button>
          {/* <Link href="/cart" className={styles.cartLink}>
            <span className={styles.cartIcon}>🛒</span>
            {getTotalItems() > 0 && (
              <span className={styles.cartBadge}>{getTotalItems()}</span>
            )}
          </Link> */}
        </nav>

        <button
          className={styles.menuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {isMenuOpen && (
        <nav className={styles.navMobile}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLinkMobile}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className={styles.themeToggleMobile}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드'}
          </button>
          {/* <Link
            href="/cart"
            className={styles.navLinkMobile}
            onClick={() => setIsMenuOpen(false)}
          >
            장바구니 {getTotalItems() > 0 && `(${getTotalItems()})`}
          </Link> */}
        </nav>
      )}
    </header>
  );
}
