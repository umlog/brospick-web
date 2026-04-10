'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AdminProduct } from '@/lib/domain/types';
import { showToast } from '../lib/toast';

function sortProducts(list: AdminProduct[]): AdminProduct[] {
  return [...list].sort((a, b) => {
    if (a.coming_soon !== b.coming_soon) return a.coming_soon ? 1 : -1;
    const aDate = a.launched_at ? new Date(a.launched_at).getTime() : -Infinity;
    const bDate = b.launched_at ? new Date(b.launched_at).getTime() : -Infinity;
    if (bDate !== aDate) return bDate - aDate;
    return a.id - b.id;
  });
}

interface UnsyncedProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
}

export function useProductCatalog() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [unsynced, setUnsynced] = useState<UnsyncedProduct[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, syncData] = await Promise.all([
        apiClient.products.list(),
        apiClient.products.checkUnsynced(),
      ]);
      setProducts(sortProducts(productsData.products));
      setUnsynced(syncData.unsynced);
      setHasLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '상품 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncProducts = useCallback(async () => {
    setSyncing(true);
    try {
      const data = await apiClient.products.sync();
      showToast(`${data.inserted}개 상품이 DB에 등록되었습니다. 가격을 설정해주세요.`, 'success');
      await fetchProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '동기화 실패';
      showToast(msg, 'error');
    } finally {
      setSyncing(false);
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(
    async (id: number, updates: { name?: string; price?: number; original_price?: number | null; coming_soon?: boolean }) => {
      setSaving(id);
      setError(null);
      try {
        const data = await apiClient.products.update(id, updates);
        setProducts((prev) => sortProducts(prev.map((p) => (p.id === id ? data.product : p))));
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

  return { products, loading, error, saving, hasLoaded, fetchProducts, updateProduct, unsynced, syncing, syncProducts };
}
