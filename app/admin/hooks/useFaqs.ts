'use client';

import { useState, useCallback } from 'react';
import { showToast } from '../lib/toast';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faqs');
      const data = await res.json();
      setFaqs(data ?? []);
      setHasLoaded(true);
    } catch {
      showToast('FAQ 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createFaq = useCallback(async (payload: Pick<Faq, 'question' | 'answer' | 'category'>) => {
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { showToast('FAQ 생성에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setFaqs((prev) => [...prev, data]);
    showToast('FAQ가 추가되었습니다.', 'success');
    return data;
  }, []);

  const updateFaq = useCallback(async (id: number, updates: Partial<Faq>) => {
    const res = await fetch('/api/admin/faqs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) { showToast('FAQ 수정에 실패했습니다.', 'error'); return null; }
    const data = await res.json();
    setFaqs((prev) => prev.map((f) => (f.id === id ? data : f)));
    showToast('FAQ가 수정되었습니다.', 'success');
    return data;
  }, []);

  const deleteFaq = useCallback(async (id: number) => {
    const res = await fetch('/api/admin/faqs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast('FAQ 삭제에 실패했습니다.', 'error'); return; }
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    showToast('FAQ가 삭제되었습니다.', 'success');
  }, []);

  return { faqs, loading, hasLoaded, fetchFaqs, createFaq, updateFaq, deleteFaq };
}
