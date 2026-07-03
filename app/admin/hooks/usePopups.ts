'use client';

import { useAdminResource } from './useAdminResource';

export interface SitePopup {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  show_once: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function usePopups() {
  const r = useAdminResource<SitePopup>({ endpoint: '/api/admin/popups', label: '팝업' });
  return {
    popups: r.items,
    loading: r.loading,
    hasLoaded: r.hasLoaded,
    fetchPopups: r.fetchList,
    createPopup: r.create,
    updatePopup: r.update,
    deletePopup: r.remove,
  };
}
