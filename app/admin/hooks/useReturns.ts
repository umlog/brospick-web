import { useState, useCallback } from 'react';
import type { ReturnRequest } from '../types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { ReturnStatus } from '@/lib/domain/enums';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';

export function useReturns(notifyOnChange: boolean) {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [processingReturns, setProcessingReturns] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const setProcessing = (id: string, value: boolean) => {
    setProcessingReturns((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const fetchReturns = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.returns.list(status ? { status } : undefined);
      setReturnRequests(data.requests);
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      showToast('교환/반품 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (requestId: string, newStatus: string, extra?: Record<string, unknown>) => {
    const ok = await showConfirm(`상태를 "${newStatus}"(으)로 변경할까요?`);
    if (!ok) return;

    setProcessing(requestId, true);
    try {
      await apiClient.returns.updateStatus(requestId, {
        status: newStatus,
        sendNotification: notifyOnChange,
        ...extra,
      });

      fetchReturns(filterStatus || undefined);
      setRejectModal(null);
      setRejectReason('');
      setTrackingModal(null);
      setTrackingInput('');
      showToast(`"${newStatus}"(으)로 변경되었습니다.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '상태 변경에 실패했습니다.', 'error');
    } finally {
      setProcessing(requestId, false);
    }
  };

  const handleDelete = async (requestId: string, requestNumber: string) => {
    const ok = await showConfirm(`요청 ${requestNumber}을(를) 정말 삭제할까요?`);
    if (!ok) return;

    setProcessing(requestId, true);
    try {
      await apiClient.returns.delete(requestId);
      setReturnRequests((prev) => prev.filter((r) => r.id !== requestId));
      setExpandedReturn(null);
      showToast('요청이 삭제되었습니다.', 'success');
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    } finally {
      setProcessing(requestId, false);
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    fetchReturns(status || undefined);
  };

  const handleRefundComplete = async (requestId: string) => {
    const ok = await showConfirm('환불 완료로 처리할까요?');
    if (!ok) return;

    setProcessing(requestId, true);
    try {
      await apiClient.returns.updateStatus(requestId, {
        status: ReturnStatus.COMPLETED,
        refundCompleted: true,
        sendNotification: notifyOnChange,
      });

      fetchReturns(filterStatus || undefined);
      showToast('환불 완료 처리되었습니다.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리에 실패했습니다.', 'error');
    } finally {
      setProcessing(requestId, false);
    }
  };

  const toggleExpanded = (requestId: string) => {
    setExpandedReturn(expandedReturn === requestId ? null : requestId);
  };

  return {
    returnRequests,
    loading,
    hasLoaded,
    processingReturns,
    filterStatus,
    expandedReturn,
    trackingModal,
    trackingInput,
    rejectModal,
    rejectReason,
    setTrackingModal,
    setTrackingInput,
    setRejectModal,
    setRejectReason,
    fetchReturns,
    handleStatusChange,
    handleDelete,
    handleFilterChange,
    handleRefundComplete,
    toggleExpanded,
  };
}
