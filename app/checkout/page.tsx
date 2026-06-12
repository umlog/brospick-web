'use client';

import { useState } from 'react';
import Script from 'next/script';
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
            <form className={styles.checkoutForm} onSubmit={handleSubmit}>
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
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
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
