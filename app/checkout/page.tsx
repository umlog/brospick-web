'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { trackInitiateCheckout } from '../../lib/analytics';
import { validateCartStock } from '../../lib/validateStock';
import { useCheckoutItems } from './hooks/useCheckoutItems';
import { useCheckoutForm } from './hooks/useCheckoutForm';
import { useOrderSubmission } from './hooks/useOrderSubmission';
import { ShippingForm } from './components/ShippingForm';
import { PaymentSection } from './components/PaymentSection';
import { OrderSummary } from './components/OrderSummary';
import { CouponInput } from './components/CouponInput';
import { formatPrice } from './utils';
import { getShippingFee } from '../../lib/constants';
import styles from './checkout-page.module.css';

export default function CheckoutPage() {
  const { checkoutItems, selectedTotalPrice, isLoading } = useCheckoutItems();
  const { formData, handleInputChange, handleConsentChange, handleAllConsentChange, openAddressSearch, savedInfo, applySavedInfo } = useCheckoutForm();

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const discountedTotal = Math.max(0, selectedTotalPrice - couponDiscount);

  const { isSubmitting, handleSubmit } = useOrderSubmission(
    formData,
    checkoutItems,
    discountedTotal,
    couponCode ?? undefined,
  );

  // 결제 페이지 진입 이벤트 (페이지 방문당 1회)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || isLoading || checkoutItems.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout(selectedTotalPrice, checkoutItems.length);
  }, [isLoading, checkoutItems.length, selectedTotalPrice]);

  // 진입 시점에 품절·재고를 미리 확인해, 문제가 있으면 버튼을 막고 안내한다.
  // (담아둔 뒤 품절된 항목으로 주문하기를 눌러도 반응 없던 문제 방지)
  const [stockIssues, setStockIssues] = useState<string[]>([]);
  useEffect(() => {
    if (isLoading || checkoutItems.length === 0) return;
    let cancelled = false;
    validateCartStock(checkoutItems).then((errors) => {
      if (!cancelled) setStockIssues(errors);
    });
    return () => { cancelled = true; };
  }, [isLoading, checkoutItems]);

  if (isLoading || checkoutItems.length === 0) {
    return null;
  }

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>결제</h1>
          <div className={styles.checkoutContent}>
            <form className={styles.checkoutForm} onSubmit={handleSubmit} noValidate>
              <ShippingForm
                formData={formData}
                onInputChange={handleInputChange}
                onAddressSearch={openAddressSearch}
                savedInfo={savedInfo}
                onUseSavedInfo={applySavedInfo}
              />
              <CouponInput
                orderAmount={selectedTotalPrice}
                appliedCode={couponCode}
                appliedDiscount={couponDiscount}
                onApply={(code, discount) => { setCouponCode(code); setCouponDiscount(discount); }}
                onRemove={() => { setCouponCode(null); setCouponDiscount(0); }}
              />
              <PaymentSection
                formData={formData}
                onInputChange={handleInputChange}
                onConsentChange={handleConsentChange}
                onAllConsentChange={handleAllConsentChange}
              />
              {stockIssues.length > 0 && (
                <div className={styles.stockWarning}>
                  <strong>품절된 상품이 있습니다.</strong>
                  <ul>
                    {stockIssues.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                  <p>장바구니에서 해당 상품을 삭제한 뒤 다시 주문해 주세요.</p>
                </div>
              )}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || stockIssues.length > 0}
              >
                {isSubmitting ? '주문 처리 중...' : `${formatPrice(discountedTotal + getShippingFee(discountedTotal, formData.postalCode))} 주문하기`}
              </button>
            </form>
            <OrderSummary
              checkoutItems={checkoutItems}
              totalPrice={discountedTotal}
              postalCode={formData.postalCode}
              couponDiscount={couponDiscount}
            />
          </div>
        </div>
      </main>
    </>
  );
}
