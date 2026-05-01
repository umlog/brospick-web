'use client';

import { useState, useCallback } from 'react';
import type { EbookOrder } from '@/lib/domain/types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';

export function useEbookOrders() {
  const [orders, setOrders] = useState<EbookOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  const setProc = (id: number, val: boolean) =>
    setProcessing((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.ebookOrders.list();
      setOrders(data.orders);
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      showToast('전자책 주문 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirm = async (id: number, orderNumber: string) => {
    const ok = await showConfirm(`${orderNumber} 입금을 확인 처리할까요?`);
    if (!ok) return;
    setProc(id, true);
    try {
      await apiClient.ebookOrders.confirm(id);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'payment_confirmed' } : o))
      );
      showToast('입금 확인 완료!', 'success');
    } catch (err) {
      showToast(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProc(id, false);
    }
  };

  const handleSendLink = async (id: number, orderNumber: string, name: string) => {
    const ok = await showConfirm(`${name}님(${orderNumber})에게 다운로드 링크를 발송할까요?`);
    if (!ok) return;
    setProc(id, true);
    try {
      await apiClient.ebookOrders.sendLink(id);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: 'download_sent', download_sent_at: new Date().toISOString() }
            : o
        )
      );
      showToast('다운로드 링크 발송 완료!', 'success');
    } catch (err) {
      showToast(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProc(id, false);
    }
  };

  const handleDelete = async (id: number, orderNumber: string) => {
    const ok = await showConfirm(`${orderNumber} 주문을 삭제할까요? 복구할 수 없습니다.`);
    if (!ok) return;
    setProc(id, true);
    try {
      await apiClient.ebookOrders.delete(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      showToast('삭제되었습니다.', 'success');
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    } finally {
      setProc(id, false);
    }
  };

  return {
    orders,
    loading,
    hasLoaded,
    processing,
    fetchOrders,
    handleConfirm,
    handleSendLink,
    handleDelete,
  };
}
