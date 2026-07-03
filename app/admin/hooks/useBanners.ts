'use client';

import { useAdminResource } from './useAdminResource';

export interface SiteBanner {
  id: number;
  message: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function useBanners() {
  const r = useAdminResource<SiteBanner>({ endpoint: '/api/admin/banners', label: '배너' });
  return {
    banners: r.items,
    loading: r.loading,
    hasLoaded: r.hasLoaded,
    fetchBanners: r.fetchList,
    createBanner: r.create,
    updateBanner: r.update,
    deleteBanner: r.remove,
  };
}
