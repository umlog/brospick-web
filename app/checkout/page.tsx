'use client';

import Script from 'next/script';
import { useCheckoutItems } from './hooks/useCheckoutItems';
import { useCheckoutForm } from './hooks/useCheckoutForm';
import { useOrderSubmission } from './hooks/useOrderSubmission';
import { ShippingForm } from './components/ShippingForm';
import { PaymentSection } from './components/PaymentSection';
import { OrderSummary } from './components/OrderSummary';
import { formatPrice } from './utils';
import styles from './checkout-page.module.css';

export default function CheckoutPage() {
  const { checkoutItems, selectedTotalPrice, isLoading } = useCheckoutItems();
  const { formData, handleInputChange, openAddressSearch } = useCheckoutForm();
  const { isSubmitting, handleSubmit } = useOrderSubmission(
    formData,
    checkoutItems,
    selectedTotalPrice
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
              />
              <PaymentSection
                formData={formData}
                onInputChange={handleInputChange}
              />
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? '주문 처리 중...' : `${formatPrice(selectedTotalPrice)} 주문하기`}
              </button>
            </form>
            <OrderSummary
              checkoutItems={checkoutItems}
              totalPrice={selectedTotalPrice}
            />
          </div>
        </div>
      </main>
    </>
  );
}
