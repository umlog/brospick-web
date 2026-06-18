'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '../../contexts/CartContext';
import { buildOrderPayload, removePurchasedItems } from '../utils';
import type { CheckoutFormData } from '../types';
import { apiClient } from '@/lib/api-client';
import { validateCartStock } from '@/lib/validateStock';
import { saveShippingToCookie } from './useCheckoutForm';

export function useOrderSubmission(
  formData: CheckoutFormData,
  checkoutItems: CartItem[],
  selectedTotalPrice: number,
  couponCode?: string,
) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (!formData.privacyConsent || !formData.thirdPartyConsent) {
      alert('필수 약관에 동의해 주세요.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

const stockErrors = await validateCartStock(checkoutItems);
    if (stockErrors.length > 0) {
      alert(stockErrors.join('\n'));
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    if (formData.paymentMethod === 'bank' && !formData.depositorName.trim()) {
      alert('입금자명을 입력해 주세요.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      if (formData.paymentMethod === 'kakaopay') {
        await handleKakaoPaySubmit();
      } else {
        await handleBankSubmit();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '주문에 실패했습니다. 다시 시도해주세요.');
      isSubmittingRef.current = false;
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
    const payload = buildOrderPayload(formData, checkoutItems, selectedTotalPrice, couponCode);

    saveShippingToCookie({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      postalCode: formData.postalCode,
      address: formData.address,
      addressDetail: formData.addressDetail,
    });

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
    const payload = buildOrderPayload(formData, checkoutItems, selectedTotalPrice, couponCode);
    const data = await apiClient.orders.create(payload);

    saveShippingToCookie({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      postalCode: formData.postalCode,
      address: formData.address,
      addressDetail: formData.addressDetail,
    });
    clearCheckoutCart(checkoutItems);

    // 쿠폰 사용 횟수는 order.service.ts createOrder에서 서버 사이드로 처리됨

    isSubmittingRef.current = false;
    setIsSubmitting(false);

    const params = new URLSearchParams({
      method: 'bank',
      order: data.orderNumber,
      amount: String(data.totalAmount),
      shippingFee: String(data.shippingFee),
      depositor: formData.depositorName,
    });
    router.push(`/order-complete?${params.toString()}`);
  };

  return { isSubmitting, handleSubmit };
}
