'use client';

import { useState, useCallback } from 'react';
import { request, ApiClientError } from '@/lib/api-client';
import { showToast } from '../lib/toast';

// 단일 엔드포인트 CRUD(목록 GET, 생성 POST, 수정 PUT {id,...}, 삭제 DELETE {id}) 어드민 리소스 훅 팩토리.
// usePopups/useBanners/useFaqs/useCoupons가 이 팩토리의 얇은 래퍼다.

interface AdminResourceConfig {
  endpoint: string;
  /** 토스트 메시지에 쓰이는 리소스 이름 (예: '팝업') */
  label: string;
  /** true면 생성 시 목록 끝에 추가 (기본: 맨 앞) */
  appendOnCreate?: boolean;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback;
}

export function useAdminResource<T extends { id: number }, TCreate = Omit<T, 'id' | 'created_at'>>({
  endpoint,
  label,
  appendOnCreate = false,
}: AdminResourceConfig) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<T[] | null>(endpoint);
      setItems(data ?? []);
      setHasLoaded(true);
    } catch {
      showToast(`${label} 목록을 불러오지 못했습니다.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [endpoint, label]);

  const create = useCallback(
    async (payload: TCreate) => {
      try {
        const data = await request<T>(endpoint, { method: 'POST', body: payload });
        setItems((prev) => (appendOnCreate ? [...prev, data] : [data, ...prev]));
        showToast(`${label} 생성 완료`, 'success');
        return data;
      } catch (err) {
        showToast(errorMessage(err, `${label} 생성에 실패했습니다.`), 'error');
        return null;
      }
    },
    [endpoint, label, appendOnCreate],
  );

  const update = useCallback(
    async (id: number, updates: Partial<T>) => {
      try {
        const data = await request<T>(endpoint, { method: 'PUT', body: { id, ...updates } });
        setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
        showToast(`${label} 수정 완료`, 'success');
        return data;
      } catch (err) {
        showToast(errorMessage(err, `${label} 수정에 실패했습니다.`), 'error');
        return null;
      }
    },
    [endpoint, label],
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        await request(endpoint, { method: 'DELETE', body: { id } });
        setItems((prev) => prev.filter((item) => item.id !== id));
        showToast(`${label} 삭제 완료`, 'success');
      } catch (err) {
        showToast(errorMessage(err, `${label} 삭제에 실패했습니다.`), 'error');
      }
    },
    [endpoint, label],
  );

  return { items, loading, hasLoaded, fetchList, create, update, remove };
}
