'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_CATEGORY_ORDER, ProductCategory, resolveCategoryOrder } from '@/lib/products';
import { showToast } from '../lib/toast';

export function useCategoryOrder() {
  const [order, setOrder] = useState<ProductCategory[]>(DEFAULT_CATEGORY_ORDER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.categories
      .getOrder()
      .then((data) => {
        if (!cancelled) setOrder(resolveCategoryOrder(data.order));
      })
      .catch((e) => {
        showToast(e instanceof Error ? e.message : '카테고리 순서 조회 실패', 'error');
      });
    return () => { cancelled = true; };
  }, []);

  const saveOrder = useCallback(async (next: ProductCategory[]): Promise<boolean> => {
    setSaving(true);
    try {
      const data = await apiClient.categories.saveOrder(next);
      setOrder(resolveCategoryOrder(data.order));
      showToast('카테고리 순서가 저장되었습니다.', 'success');
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : '카테고리 순서 저장 실패', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { order, saving, saveOrder };
}
