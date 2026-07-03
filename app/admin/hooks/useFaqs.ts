'use client';

import { useAdminResource } from './useAdminResource';

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
  const r = useAdminResource<Faq, Pick<Faq, 'question' | 'answer' | 'category'>>({
    endpoint: '/api/admin/faqs',
    label: 'FAQ',
    appendOnCreate: true,
  });
  return {
    faqs: r.items,
    loading: r.loading,
    hasLoaded: r.hasLoaded,
    fetchFaqs: r.fetchList,
    createFaq: r.create,
    updateFaq: r.update,
    deleteFaq: r.remove,
  };
}
