import { useState, useCallback } from 'react';
import type { ProductSize } from '../types';

export function useProductSizes(password: string) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSizes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/sizes');
      if (!response.ok) throw new Error('조회 실패');
      const data = await response.json();
      setSizes(data.sizes);
    } catch {
      alert('사이즈 정보 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSize = async (productId: number, size: string, status: string) => {
    try {
      const response = await fetch('/api/products/sizes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ productId, size, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '변경에 실패했습니다.');
        return;
      }

      setSizes((prev) =>
        prev.map((s) =>
          s.product_id === productId && s.size === size
            ? { ...s, status: status as ProductSize['status'] }
            : s
        )
      );
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  return { sizes, loading, fetchSizes, updateSize };
}
