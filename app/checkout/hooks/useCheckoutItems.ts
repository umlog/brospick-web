import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../../contexts/CartContext';

// iOS Safari 등에서 결제 중 sessionStorage가 유실되면 /cart로 튕기던 문제를 완화하기 위한 백업 키.
export const CHECKOUT_BACKUP_KEY = 'brospick-checkout-backup';

export function clearCheckoutBackup() {
  sessionStorage.removeItem('checkoutItems');
  localStorage.removeItem(CHECKOUT_BACKUP_KEY);
}

export function useCheckoutItems() {
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 세션이 비었으면 localStorage 백업으로 폴백한다.
    const raw = sessionStorage.getItem('checkoutItems') ?? localStorage.getItem(CHECKOUT_BACKUP_KEY);
    if (raw) {
      try {
        setCheckoutItems(JSON.parse(raw));
        localStorage.setItem(CHECKOUT_BACKUP_KEY, raw);
      } catch (error) {
        console.error('Failed to load checkout items', error);
        router.push('/cart');
      }
    } else {
      router.push('/cart');
    }
    setIsLoading(false);
  }, [router]);

  const selectedTotalPrice = checkoutItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return { checkoutItems, selectedTotalPrice, isLoading };
}
