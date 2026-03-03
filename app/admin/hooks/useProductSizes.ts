import { useState, useCallback } from 'react';
import type { ProductSize } from '../types';
import { apiClient } from '@/lib/api-client';

export function useProductSizes() {
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

  const updateSize = async (productId: number, size: string, status: string, delayText?: string | null) => {
    try {
      const result = await apiClient.productSizes.update({
        productId,
        size,
        status,
        ...(delayText !== undefined && { delay_text: delayText }),
      });
      setSizes((prev) =>
        prev.map((s) =>
          s.product_id === productId && s.size === size
            ? { ...s, status: result.size.status as ProductSize['status'], delay_text: result.size.delay_text }
            : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '변경에 실패했습니다.');
    }
  };

  const updateDelayText = async (productId: number, size: string, delayText: string | null) => {
    try {
      const result = await apiClient.productSizes.update({
        productId,
        size,
        delay_text: delayText,
      });
      setSizes((prev) =>
        prev.map((s) =>
          s.product_id === productId && s.size === size
            ? { ...s, delay_text: result.size.delay_text }
            : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '지연배송 텍스트 변경에 실패했습니다.');
    }
  };

  const updateStock = async (productId: number, size: string, stock: number) => {
    try {
      const result = await apiClient.productSizes.update({ productId, size, stock });
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

  return { sizes, loading, fetchSizes, updateSize, updateStock, updateDelayText };
}
