'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './order-complete.module.css';

interface OrderData {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  depositorName: string;
}

export default function OrderCompletePage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('orderComplete');
    if (stored) {
      try {
        setOrderData(JSON.parse(stored));
        sessionStorage.removeItem('orderComplete');
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  if (!orderData) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.successIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className={styles.title}>주문이 완료되었습니다</h1>
        <p className={styles.orderNumber}>주문번호: {orderData.orderNumber}</p>

        <div className={styles.bankSection}>
          <h2>입금 안내</h2>
          <div className={styles.bankCard}>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>입금 은행</span>
              <span className={styles.bankValue}>카카오뱅크</span>
            </div>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>계좌번호</span>
              <span className={styles.bankValue}>3333-27-7618216</span>
            </div>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>예금주</span>
              <span className={styles.bankValue}>홍주영</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>입금 금액</span>
              <span className={styles.bankAmount}>₩{orderData.totalAmount.toLocaleString()}</span>
            </div>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>입금자명</span>
              <span className={styles.bankValue}>{orderData.depositorName}</span>
            </div>
          </div>
          <p className={styles.notice}>
            주문 후 24시간 이내에 입금해주세요. 미입금 시 주문이 자동 취소됩니다.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.homeButton}>
            홈으로 돌아가기
          </Link>
          <Link href="/apparel" className={styles.shopButton}>
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </main>
  );
}
