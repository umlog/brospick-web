'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './FloatingTracker.module.css';

interface OrderItem {
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderResult {
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function FloatingTracker() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrderResult | null>(null);

  // URL 파라미터로 자동 열기 (?track=true)
  useEffect(() => {
    if (searchParams.get('track') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setResult(data.order);
    } catch {
      setError('조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setOrderNumber('');
    setPhone('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>배송 조회</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.panelBody}>
            {!result ? (
              <form onSubmit={handleTrack}>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.inputGroup}>
                  <label>주문번호</label>
                  <input
                    type="text"
                    placeholder="BP-20250209-1234"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>주문 시 입력한 전화번호</label>
                  <input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.trackButton} disabled={loading}>
                  {loading ? '조회 중...' : '조회하기'}
                </button>
              </form>
            ) : (
              <div className={styles.result}>
                <span className={`${styles.statusBadge} ${styles[`status${result.status}`]}`}>
                  {result.status}
                </span>

                <div className={styles.orderInfo}>
                  <div className={styles.orderRow}>
                    <span>주문번호</span>
                    <span>{result.order_number}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span>주문일</span>
                    <span>{formatDate(result.created_at)}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span>결제금액</span>
                    <span>{`\u20A9${result.total_amount.toLocaleString()}`}</span>
                  </div>
                </div>

                {result.order_items.length > 0 && (
                  <div className={styles.itemsList}>
                    <h4>주문 상품</h4>
                    {result.order_items.map((item, i) => (
                      <div key={i} className={styles.item}>
                        {item.product_name} <span>/ {item.size} / {item.quantity}개</span>
                      </div>
                    ))}
                  </div>
                )}

                <button className={styles.resetButton} onClick={handleReset}>
                  다른 주문 조회
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="배송 조회"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        )}
      </button>
    </>
  );
}
