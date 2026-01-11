'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import styles from './header.module.css';
import symbolImg from '../../styles/symbol.svg';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getTotalItems } = useCart();

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
