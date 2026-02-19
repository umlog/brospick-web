import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../../contexts/CartContext';

export function useCheckoutItems() {
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedItems = sessionStorage.getItem('checkoutItems');
    if (storedItems) {
      try {
        setCheckoutItems(JSON.parse(storedItems));
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
