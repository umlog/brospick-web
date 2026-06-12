'use client';

import { useState, useCallback } from 'react';
import { showToast } from '../lib/toast';

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
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/popups');
      const data = await res.json();
      setPopups(data ?? []);
      setHasLoaded(true);
    } catch {
      showToast('팝업 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPopup = useCallback(async (payload: Omit<SitePopup, 'id' | 'created_at'>) => {
    const res = await fetch('/api/admin/popups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { showToast('팝업 생성에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setPopups((prev) => [data, ...prev]);
    showToast('팝업이 생성되었습니다.', 'success');
    return data;
  }, []);

  const updatePopup = useCallback(async (id: number, updates: Partial<SitePopup>) => {
    const res = await fetch('/api/admin/popups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) { showToast('팝업 수정에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setPopups((prev) => prev.map((p) => (p.id === id ? data : p)));
    showToast('팝업이 수정되었습니다.', 'success');
    return data;
  }, []);

  const deletePopup = useCallback(async (id: number) => {
    const res = await fetch('/api/admin/popups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast('팝업 삭제에 실패했습니다.', 'error'); return; }
    setPopups((prev) => prev.filter((p) => p.id !== id));
    showToast('팝업이 삭제되었습니다.', 'success');
  }, []);

  return { popups, loading, hasLoaded, fetchPopups, createPopup, updatePopup, deletePopup };
}
