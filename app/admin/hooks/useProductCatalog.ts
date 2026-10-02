'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AdminProduct } from '@/lib/domain/types';
import { showToast } from '../lib/toast';

function sortProducts(list: AdminProduct[]): AdminProduct[] {
  return [...list].sort((a, b) => {
    if (a.sort_order !== null && b.sort_order !== null) return a.sort_order - b.sort_order;
    if (a.sort_order !== null) return -1;
    if (b.sort_order !== null) return 1;
    if (a.coming_soon !== b.coming_soon) return a.coming_soon ? 1 : -1;
    const aDate = a.launched_at ? new Date(a.launched_at).getTime() : -Infinity;
    const bDate = b.launched_at ? new Date(b.launched_at).getTime() : -Infinity;
    if (bDate !== aDate) return bDate - aDate;
    return a.id - b.id;
  });
}

/** products.ts에는 있는데 product_sizes 행이 없는 옵션 (예: 새로 추가한 부츠스킨 스티커) */
interface MissingSize {
  product_id: number;
  size: string;
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
  const [missingSizes, setMissingSizes] = useState<MissingSize[]>([]);
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
      setMissingSizes(syncData.missingSizes);
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
      const messages = [
        data.inserted > 0 && `상품 ${data.inserted}개 등록 — 가격을 설정해주세요.`,
        data.insertedSizes > 0 && `옵션 ${data.insertedSizes}개를 품절로 등록 — 재고를 입력하면 판매됩니다.`,
      ].filter(Boolean);
      showToast(messages.join(' ') || '이미 동기화되어 있습니다.', 'success');
      await fetchProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '동기화 실패';
      showToast(msg, 'error');
    } finally {
      setSyncing(false);
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(
    async (id: number, updates: { name?: string; price?: number; original_price?: number | null; coming_soon?: boolean; sort_order?: number | null }) => {
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

  const reorderProducts = useCallback(
    async (orders: { id: number; sort_order: number }[]) => {
      try {
        await apiClient.products.reorder(orders);
        const orderMap = new Map(orders.map((o) => [o.id, o.sort_order]));
        setProducts((prev) =>
          sortProducts(
            prev.map((p) => ({
              ...p,
              sort_order: orderMap.get(p.id) ?? p.sort_order,
            }))
          )
        );
        showToast('순서가 저장되었습니다.', 'success');
      } catch (e) {
        const msg = e instanceof Error ? e.message : '순서 저장 실패';
        showToast(msg, 'error');
      }
    },
    []
  );

  return { products, loading, error, saving, hasLoaded, fetchProducts, updateProduct, reorderProducts, unsynced, missingSizes, syncing, syncProducts };
}
