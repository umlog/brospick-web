'use client';

import { useState, useCallback } from 'react';
import { showToast } from '../lib/toast';

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
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      setBanners(data ?? []);
      setHasLoaded(true);
    } catch {
      showToast('배너 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBanner = useCallback(async (payload: Omit<SiteBanner, 'id' | 'created_at'>) => {
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { showToast('배너 생성에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setBanners((prev) => [data, ...prev]);
    showToast('배너가 생성되었습니다.', 'success');
    return data;
  }, []);

  const updateBanner = useCallback(async (id: number, updates: Partial<SiteBanner>) => {
    const res = await fetch('/api/admin/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) { showToast('배너 수정에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setBanners((prev) => prev.map((b) => (b.id === id ? data : b)));
    showToast('배너가 수정되었습니다.', 'success');
    return data;
  }, []);

  const deleteBanner = useCallback(async (id: number) => {
    const res = await fetch('/api/admin/banners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast('배너 삭제에 실패했습니다.', 'error'); return; }
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast('배너가 삭제되었습니다.', 'success');
  }, []);

  return { banners, loading, hasLoaded, fetchBanners, createBanner, updateBanner, deleteBanner };
}
