'use client';

import { useAdminResource } from './useAdminResource';

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
  const r = useAdminResource<Coupon, CouponFormData>({ endpoint: '/api/admin/coupons', label: '쿠폰' });
  return {
    coupons: r.items,
    loading: r.loading,
    hasLoaded: r.hasLoaded,
    fetchCoupons: r.fetchList,
    createCoupon: r.create,
    updateCoupon: r.update,
    deleteCoupon: r.remove,
  };
}
