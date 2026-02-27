import { useState, useCallback } from 'react';
import type { ProductSize } from '../types';
import { apiClient } from '@/lib/api-client';

export function useProductSizes(password: string) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSizes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.productSizes.list();
      setSizes(data.sizes);
    } catch {
      alert('사이즈 정보 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSize = async (productId: number, size: string, status: string) => {
    try {
      const result = await apiClient.productSizes.update(password, { productId, size, status });
      setSizes((prev) =>
        prev.map((s) =>
          s.product_id === productId && s.size === size
            ? { ...s, status: result.size.status as ProductSize['status'] }
            : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '변경에 실패했습니다.');
    }
  };

  const updateStock = async (productId: number, size: string, stock: number) => {
    try {
      const result = await apiClient.productSizes.update(password, { productId, size, stock });
      setSizes((prev) =>
        prev.map((s) =>
          s.product_id === productId && s.size === size
            ? { ...s, stock: result.size.stock, status: result.size.status as ProductSize['status'] }
            : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '재고 변경에 실패했습니다.');
    }
  };

  return { sizes, loading, fetchSizes, updateSize, updateStock };
}
