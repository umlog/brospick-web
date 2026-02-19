import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '../../contexts/CartContext';
import { buildOrderPayload, removePurchasedItems } from '../utils';
import type { CheckoutFormData, OrderResponse } from '../types';

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
    setIsSubmitting(true);

    try {
      const payload = buildOrderPayload(formData, checkoutItems, selectedTotalPrice);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주문에 실패했습니다.');
      }

      const data: OrderResponse = await response.json();

      const currentCart: CartItem[] = JSON.parse(localStorage.getItem('brospick-cart') || '[]');
      const updatedItems = removePurchasedItems(currentCart, checkoutItems);

      localStorage.setItem('brospick-cart', JSON.stringify(updatedItems));
      sessionStorage.removeItem('checkoutItems');

      if (updatedItems.length === 0) {
        clearCart();
      }

      sessionStorage.setItem(
        'orderComplete',
        JSON.stringify({
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          shippingFee: data.shippingFee,
          depositorName: formData.depositorName,
        })
      );
      router.push('/order-complete');
    } catch (error) {
      alert(error instanceof Error ? error.message : '주문에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
}
