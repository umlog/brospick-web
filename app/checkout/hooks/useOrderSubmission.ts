import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '../../contexts/CartContext';
import { buildOrderPayload, removePurchasedItems } from '../utils';
import type { CheckoutFormData } from '../types';
import { apiClient } from '@/lib/api-client';

export function useOrderSubmission(
  formData: CheckoutFormData,
  checkoutItems: CartItem[],
  selectedTotalPrice: number
) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.privacyConsent || !formData.thirdPartyConsent) {
      alert('필수 약관에 동의해 주세요.');
      return;
    }

    if (formData.paymentMethod === 'bank' && !formData.depositorName.trim()) {
      alert('입금자명을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (formData.paymentMethod === 'kakaopay') {
        await handleKakaoPaySubmit();
      } else {
        await handleBankSubmit();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '주문에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  const clearCheckoutCart = (checkoutItems: CartItem[]) => {
    const currentCart: CartItem[] = JSON.parse(localStorage.getItem('brospick-cart') || '[]');
    const updatedItems = removePurchasedItems(currentCart, checkoutItems);
    localStorage.setItem('brospick-cart', JSON.stringify(updatedItems));
    sessionStorage.removeItem('checkoutItems');
    if (updatedItems.length === 0) clearCart();
  };

  const handleKakaoPaySubmit = async () => {
    const payload = buildOrderPayload(formData, checkoutItems, selectedTotalPrice);

    const res = await fetch('/api/payment/kakao/ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '카카오페이 결제 준비에 실패했습니다.');
    }

    const data = await res.json();

    window.location.href = data.redirectUrl;
  };

  const handleBankSubmit = async () => {
    const payload = buildOrderPayload(formData, checkoutItems, selectedTotalPrice);
    const data = await apiClient.orders.create(payload);

    clearCheckoutCart(checkoutItems);

    sessionStorage.setItem(
      'orderComplete',
      JSON.stringify({
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        shippingFee: data.shippingFee,
        depositorName: formData.depositorName,
      })
    );
    setIsSubmitting(false);
    router.push('/order-complete');
  };

  return { isSubmitting, handleSubmit };
}
