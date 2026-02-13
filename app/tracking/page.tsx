'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './tracking.module.css';

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface ReturnRequest {
  request_number: string;
  type: '교환' | '반품';
  status: string;
  reason: string;
  exchange_size?: string;
  quantity: number;
  reject_reason?: string;
  refund_amount?: number;
  refund_completed?: boolean;
  return_tracking_number?: string;
  created_at: string;
  order_item_id: string;
}

interface OrderResult {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  tracking_number: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[];
  return_requests: ReturnRequest[];
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber') || '';

  const [orderNumber, setOrderNumber] = useState(orderNumberParam);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    if (orderNumberParam) {
      setOrderNumber(orderNumberParam);
    }
  }, [orderNumberParam]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>주문 조회</h1>
          <p>주문번호와 전화번호를 입력하면 배송 현황을 확인할 수 있습니다.</p>
        </div>

        {!result ? (
          <form onSubmit={handleTrack} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <label>주문번호</label>
              <input
                type="text"
                placeholder="BP-20250209-1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                readOnly={!!orderNumberParam}
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
                autoFocus
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
              {result.tracking_number && (
                <>
                  <div className={styles.orderRow}>
                    <span>택배사</span>
                    <span>CJ대한통운</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span>운송장번호</span>
                    <a
                      href={`https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(result.tracking_number)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.trackingNumber}
                    >
                      {result.tracking_number}
                    </a>
                  </div>
                </>
              )}
              <div className={styles.orderRow}>
                <span>주문일</span>
                <span>{formatDate(result.created_at)}</span>
              </div>
              <div className={styles.orderRow}>
                <span>결제금액</span>
                <span>{`₩${result.total_amount.toLocaleString()}`}</span>
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

            {result.return_requests.length > 0 && (
              <div className={styles.returnSection}>
                <h4>교환/반품 현황</h4>
                {result.return_requests.map((req) => {
                  const item = result.order_items.find(i => i.id === req.order_item_id);
                  return (
                    <div key={req.request_number} className={styles.returnCard}>
                      <div className={styles.returnTop}>
                        <span className={styles.returnTypeBadge} data-type={req.type}>
                          {req.type}
                        </span>
                        <span className={styles.returnStatusBadge} data-status={req.status}>
                          {req.status}
                          {req.type === '반품' && req.refund_completed && req.status === '처리완료' && ' (환불완료)'}
                        </span>
                      </div>
                      <div className={styles.returnDetails}>
                        {item && <span>{item.product_name} ({item.size}){req.exchange_size ? ` → ${req.exchange_size}` : ''}</span>}
                        <span className={styles.returnDate}>{formatDate(req.created_at)}</span>
                      </div>
                      {req.status === '거절' && req.reject_reason && (
                        <div className={styles.returnRejectReason}>거절 사유: {req.reject_reason}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button className={styles.resetButton} onClick={handleReset}>
              다른 주문 조회
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>주문 조회</h1>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
