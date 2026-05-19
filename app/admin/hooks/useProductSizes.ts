import { useState, useCallback } from 'react';
import type { ProductSize } from '../types';
import { apiClient } from '@/lib/api-client';
import { showToast } from '../lib/toast';

export function useProductSizes() {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSizes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.productSizes.list();
      setSizes(data.sizes);
      setHasLoaded(true);
    } catch {
      showToast('사이즈 정보 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertLocal = (updated: ProductSize) => {
    setSizes((prev) => {
      const exists = prev.some((s) => s.product_id === updated.product_id && s.size === updated.size);
      return exists
        ? prev.map((s) => (s.product_id === updated.product_id && s.size === updated.size ? updated : s))
        : [...prev, updated];
    });
  };

  const updateSize = async (productId: number, size: string, status: string, delayText?: string | null) => {
    try {
      const result = await apiClient.productSizes.update({
        productId,
        size,
        status,
        ...(delayText !== undefined && { delay_text: delayText }),
      });
      upsertLocal(result.size);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다.', 'error');
    }
  };

  const updateDelayText = async (productId: number, size: string, delayText: string | null) => {
    try {
      const result = await apiClient.productSizes.update({ productId, size, delay_text: delayText });
      upsertLocal(result.size);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '지연배송 텍스트 변경에 실패했습니다.', 'error');
    }
  };

  const updateStock = async (productId: number, size: string, stock: number) => {
    try {
      const result = await apiClient.productSizes.update({ productId, size, stock });
      upsertLocal(result.size);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재고 변경에 실패했습니다.', 'error');
    }
  };

  return { sizes, loading, hasLoaded, fetchSizes, updateSize, updateStock, updateDelayText };
}
