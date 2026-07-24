import type { CartItem } from '@/app/contexts/CartContext';

interface ProductSize {
  product_id: number;
  size: string;
  status: string;
  stock: number;
}

/**
 * 장바구니 아이템들의 품절·재고 초과 여부를 체크합니다.
 * 문제가 있는 아이템마다 안내 메시지를 반환합니다.
 * API 호출 실패 시 빈 배열 반환 (주문 흐름 차단하지 않음).
 */
export async function validateCartStock(items: CartItem[]): Promise<string[]> {
  try {
    const res = await fetch('/api/products/sizes');
    if (!res.ok) return [];

    // API는 { sizes: [...] } 형태로 응답한다. (과거 배열로 잘못 파싱해 검증이 무력화됐던 버그 수정)
    const data = await res.json();
    const sizes: ProductSize[] = Array.isArray(data) ? data : data.sizes ?? [];
    const errors: string[] = [];

    for (const item of items) {
      const row = sizes.find((s) => s.product_id === item.id && s.size === item.size);
      if (!row) continue;
      if (row.status === 'sold_out' || row.stock <= 0) {
        errors.push(`'${item.name}' (${item.size}) 은(는) 품절되었습니다. 장바구니에서 제거해 주세요.`);
      } else if (item.quantity > row.stock) {
        errors.push(`'${item.name}' (${item.size}) 의 남은 재고 수량은 ${row.stock}개 입니다.`);
      }
    }

    return errors;
  } catch {
    return [];
  }
}
