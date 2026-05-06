import type { CartItem } from '@/app/contexts/CartContext';

interface ProductSize {
  product_id: number;
  size: string;
  stock: number;
}

/**
 * 장바구니 아이템들의 재고 초과 여부를 체크합니다.
 * 초과된 아이템마다 안내 메시지를 반환합니다.
 * API 호출 실패 시 빈 배열 반환 (주문 흐름 차단하지 않음).
 */
export async function validateCartStock(items: CartItem[]): Promise<string[]> {
  try {
    const res = await fetch('/api/products/sizes');
    if (!res.ok) return [];

    const sizes: ProductSize[] = await res.json();
    const errors: string[] = [];

    for (const item of items) {
      const row = sizes.find((s) => s.product_id === item.id && s.size === item.size);
      if (!row) continue;
      if (item.quantity > row.stock) {
        errors.push(`'${item.name}' (${item.size}) 의 남은 재고 수량은 ${row.stock}개 입니다.`);
      }
    }

    return errors;
  } catch {
    return [];
  }
}
