'use client';

import { useState, useCallback } from 'react';
import { showToast } from '../lib/toast';

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'amount' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  description: string;
  created_at: string;
}

export type CouponFormData = Omit<Coupon, 'id' | 'used_count' | 'created_at'>;

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data ?? []);
      setHasLoaded(true);
    } catch {
      showToast('쿠폰 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoupon = useCallback(async (payload: CouponFormData) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? '쿠폰 생성에 실패했습니다.', 'error'); return null; }
    setCoupons((prev) => [data, ...prev]);
    showToast('쿠폰이 생성되었습니다.', 'success');
    return data;
  }, []);

  const updateCoupon = useCallback(async (id: number, updates: Partial<Coupon>) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) { showToast('쿠폰 수정에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setCoupons((prev) => prev.map((c) => (c.id === id ? data : c)));
    showToast('쿠폰이 수정되었습니다.', 'success');
    return data;
  }, []);

  const deleteCoupon = useCallback(async (id: number) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast('쿠폰 삭제에 실패했습니다.', 'error'); return; }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast('쿠폰이 삭제되었습니다.', 'success');
  }, []);

  return { coupons, loading, hasLoaded, fetchCoupons, createCoupon, updateCoupon, deleteCoupon };
}
