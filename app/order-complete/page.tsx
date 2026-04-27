'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BANK } from '../../lib/constants';
import { useCart, CartItem } from '../contexts/CartContext';
import { removePurchasedItems } from '../checkout/utils';
import styles from './order-complete.module.css';

function TransferButton({ amount }: { amount: number }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const handleToss = () => {
    const url = `supertoss://send?amount=${amount}&bank=${encodeURIComponent(BANK.name)}&accountNo=${BANK.account}&origin=brospick`;
    window.location.href = url;
  };

  if (!isMobile) return null;

  return (
    <button onClick={handleToss} className={styles.transferButton}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
      바로 송금하기
      <span className={styles.transferSubtext}>토스 앱으로 연결</span>
    </button>
  );
}

interface OrderData {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  depositorName: string;
  paymentMethod?: 'kakaopay' | 'bank';
}

function OrderCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const { clearCart } = useCart();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const method = searchParams.get('method');
    const orderNumber = searchParams.get('order');
    const amount = searchParams.get('amount');
    const shippingFee = searchParams.get('shippingFee');

    // 카카오페이 결제 완료 (URL 파라미터로 전달)
    if (method === 'kakao' && orderNumber && amount) {
      // 결제 성공 시점에 장바구니 정리
      const storedItems = sessionStorage.getItem('checkoutItems');
      if (storedItems) {
        try {
          const checkoutItems: CartItem[] = JSON.parse(storedItems);
          const currentCart: CartItem[] = JSON.parse(localStorage.getItem('brospick-cart') || '[]');
          const updatedItems = removePurchasedItems(currentCart, checkoutItems);
          localStorage.setItem('brospick-cart', JSON.stringify(updatedItems));
          if (updatedItems.length === 0) clearCart();
        } catch {
          // 장바구니 정리 실패해도 주문 완료 페이지는 정상 표시
        }
        sessionStorage.removeItem('checkoutItems');
      }

      localStorage.setItem('brospick-last-order', orderNumber);
      setOrderData({
        orderNumber,
        totalAmount: parseInt(amount, 10),
        shippingFee: parseInt(shippingFee || '0', 10),
        depositorName: '',
        paymentMethod: 'kakaopay',
      });
      return;
    }

    // 무통장입금 (URL 파라미터로 전달)
    if (method === 'bank' && orderNumber && amount) {
      const depositorName = searchParams.get('depositor') || '';
      localStorage.setItem('brospick-last-order', orderNumber);
      setOrderData({
        orderNumber,
        totalAmount: parseInt(amount, 10),
        shippingFee: parseInt(shippingFee || '0', 10),
        depositorName,
        paymentMethod: 'bank',
      });
      return;
    }

    router.push('/');
  }, [router, searchParams]);

  if (!orderData) {
    return null;
  }

  const isKakao = orderData.paymentMethod === 'kakaopay';

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

        {isKakao ? (
          <div className={styles.bankSection}>
            <h2>결제 완료</h2>
            <div className={styles.bankCard}>
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>결제 수단</span>
                <span className={styles.bankValue}>카카오페이</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>결제 금액</span>
                <span className={styles.bankAmount}>₩{orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <p className={styles.notice}>
              결제가 정상적으로 완료되었습니다. 주문 확인 후 배송이 진행됩니다.
            </p>
          </div>
        ) : (
          <div className={styles.bankSection}>
            <h2>입금 안내</h2>
            <div className={styles.bankCard}>
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>입금 은행</span>
                <span className={styles.bankValue}>{BANK.name}</span>
              </div>
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>계좌번호</span>
                <span className={styles.bankValue}>{BANK.account}</span>
              </div>
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>예금주</span>
                <span className={styles.bankValue}>{BANK.holder}</span>
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
            <TransferButton amount={orderData.totalAmount} />
            <p className={styles.notice}>
              {BANK.notice}
            </p>
          </div>
        )}

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

export default function OrderCompletePageWrapper() {
  return (
    <Suspense>
      <OrderCompletePage />
    </Suspense>
  );
}
