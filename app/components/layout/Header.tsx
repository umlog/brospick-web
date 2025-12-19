'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './header.module.css';
import symbolImg from '../../styles/symbol.svg';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Manifesto', href: '#manifesto' },
    { label: 'Project', href: '#project' },
    { label: 'Picker', href: '#picker' },
    { label: 'Apparel', href: '#apparel' },
    { label: 'Contact', href: '#contact' },
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
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
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
            <a
              key={item.href}
              href={item.href}
              className={styles.navLinkMobile}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
