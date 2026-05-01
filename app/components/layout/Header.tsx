'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './header.module.css';
import symbolImg from '../../styles/symbol.svg';
import { SOCIAL_MEDIA } from '../../../lib/constants';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { getTotalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { label: 'BROSPICK', href: '/#manifesto' },
    { label: 'BLOG', href: '/interviews' },
    { label: 'SPORTWEAR', href: '/apparel-showcase' },
    { label: 'EBOOK', href: '/ebook' },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <Image
            src={symbolImg}
            alt="Brospick"
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* 데스크탑 네비 */}
        <nav className={styles.navDesktop}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
          <Link href="/cart" className={styles.cartLink}>
            <svg className={styles.cartIcon} width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {getTotalItems() > 0 && (
              <span className={styles.cartBadge}>{getTotalItems()}</span>
            )}
          </Link>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="테마 전환">
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
        </nav>

        {/* 모바일 왼쪽: 햄버거 + 테마 */}
        <div className={styles.mobileLeft}>
          <button
            className={`${styles.menuButton} ${isMenuOpen ? styles.open : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <button onClick={toggleTheme} className={styles.themeToggleMobileIcon} aria-label="테마 전환">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 오른쪽: 장바구니 */}
        <div className={styles.mobileRight}>
          <Link href="/cart" className={styles.mobileCartBtn} onClick={closeMenu}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {getTotalItems() > 0 && (
              <span className={styles.cartBadge}>{getTotalItems()}</span>
            )}
          </Link>
        </div>
      </div>

      {/* 모바일 풀스크린 메뉴 */}
      {isMenuOpen && (
        <nav className={styles.navMobile}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLinkMobile}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.menuDivider} />
          <Link href="/cart" className={styles.menuCartLink} onClick={closeMenu}>
            장바구니 {getTotalItems() > 0 && `(${getTotalItems()})`}
          </Link>
          <div className={styles.menuSocial}>
            <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" className={styles.menuSocialLink} aria-label="인스타그램">
              {/* Instagram */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href={SOCIAL_MEDIA.threads} target="_blank" rel="noopener noreferrer" className={styles.menuSocialLink} aria-label="스레드">
              {/* Threads */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.474 12.01v-.017c.02-3.579.87-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.594 12c.024 3.087.714 5.495 2.05 7.163 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.583-1.289-.879-2.309-.885h-.026c-.784 0-1.787.268-2.434 1.32l-1.752-1.067C8.17 5.886 9.686 5.02 11.726 5.008h.032c3.235.02 5.079 2.022 5.079 5.542v.031c0 .157-.004.315-.01.475a6.77 6.77 0 0 1 1.56 1.063c1.039.956 1.707 2.26 1.938 3.773.236 1.547-.028 3.166-1.039 4.686C17.714 22.747 15.465 23.98 12.186 24zm-.7-9.542c-.05 0-.099.002-.148.006-.951.053-1.716.35-2.216.858-.39.396-.58.913-.55 1.497.074 1.368 1.568 1.798 2.675 1.738 1.189-.064 2.058-.487 2.585-1.257.387-.563.588-1.302.596-2.192a12.048 12.048 0 0 0-2.942-.65z"/>
              </svg>
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
