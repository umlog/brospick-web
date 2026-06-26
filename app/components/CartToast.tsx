'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import ProductImage from './ProductImage';
import styles from './cart-toast.module.css';

const VISIBLE_MS = 2600;

// 장바구니 담기 직후 우상단에 잠깐 떠오르는 확인 토스트.
// CartContext.lastAdd(nonce 증가) 신호를 구독해 표시한다.
export default function CartToast() {
  const { lastAdd } = useCart();
  const [visible, setVisible] = useState(false);
  const [item, setItem] = useState<{ name: string; image: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastAdd) return;
    setItem({ name: lastAdd.name, image: lastAdd.image });
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [lastAdd]);

  if (!item) return null;

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.thumb}>
        <ProductImage src={item.image} alt={item.name} className={styles.thumbImg} sizes="48px" />
      </div>
      <div className={styles.body}>
        <span className={styles.title}>장바구니에 담았어요</span>
        <span className={styles.name}>{item.name}</span>
      </div>
      <Link href="/cart" className={styles.link} onClick={() => setVisible(false)}>
        보기
      </Link>
    </div>
  );
}
