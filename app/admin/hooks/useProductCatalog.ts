'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AdminProduct } from '@/lib/domain/types';
import { showToast } from '../lib/toast';

export function useProductCatalog() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null); // product id being saved

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.products.list();
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : '상품 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(
    async (id: number, updates: { name?: string; price?: number; original_price?: number | null }) => {
      setSaving(id);
      setError(null);
      try {
        const data = await apiClient.products.update(id, updates);
        setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
        showToast('저장되었습니다.', 'success');
      } catch (e) {
        const msg = e instanceof Error ? e.message : '상품 수정 실패';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setSaving(null);
      }
    },
    []
  );

  return { products, loading, error, saving, fetchProducts, updateProduct };
}
