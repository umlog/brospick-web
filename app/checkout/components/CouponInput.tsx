'use client';

import { useState } from 'react';
import styles from '../checkout-page.module.css';

interface CouponResult {
  id: number;
  code: string;
  discount_type: 'amount' | 'percent';
  discount_value: number;
  discount: number;
  description: string;
}

interface Props {
  orderAmount: number;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
  appliedCode: string | null;
  appliedDiscount: number;
}

export function CouponInput({ orderAmount, onApply, onRemove, appliedCode, appliedDiscount }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), order_amount: orderAmount }),
    });

    const data: CouponResult & { error?: string } = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? '쿠폰 적용에 실패했습니다.');
      return;
    }

    onApply(data.code, data.discount);
    setCode('');
  };

  if (appliedCode) {
    return (
      <div className={styles.couponSection}>
        <p className={styles.couponTitle}>쿠폰</p>
        <div className={styles.couponSuccess}>
          <span className={styles.couponSuccessText}>
            {appliedCode} — {appliedDiscount.toLocaleString()}원 할인 적용
          </span>
          <button className={styles.couponRemoveBtn} onClick={onRemove}>제거</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.couponSection}>
      <p className={styles.couponTitle}>쿠폰</p>
      <div className={styles.couponInputRow}>
        <input
          className={styles.couponInputField}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="쿠폰 코드 입력"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply(); } }}
          disabled={loading}
        />
        <button
          type="button"
          className={styles.couponApplyBtn}
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? '확인 중...' : '적용'}
        </button>
      </div>
      {error && <p className={styles.couponError}>{error}</p>}
    </div>
  );
}
