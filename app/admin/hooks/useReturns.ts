import { useState, useCallback } from 'react';
import type { ReturnRequest } from '../types';
import { apiClient } from '@/lib/api-client';
import { ReturnStatus } from '@/lib/domain/enums';

export function useReturns(password: string, notifyOnChange: boolean) {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchReturns = useCallback(async (pw: string, status?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.returns.list(pw, status ? { status } : undefined);
      setReturnRequests(data.requests);
    } catch {
      alert('교환/반품 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (requestId: string, newStatus: string, extra?: Record<string, unknown>) => {
    const confirmMsg = `상태를 "${newStatus}"(으)로 변경할까요?`;
    if (!confirm(confirmMsg)) return;

    try {
      await apiClient.returns.updateStatus(requestId, password, {
        status: newStatus,
        sendNotification: notifyOnChange,
        ...extra,
      });

      fetchReturns(password, filterStatus || undefined);
      setRejectModal(null);
      setRejectReason('');
      setTrackingModal(null);
      setTrackingInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (requestId: string, requestNumber: string) => {
    if (!confirm(`요청 ${requestNumber}을(를) 정말 삭제할까요?`)) return;

    try {
      await apiClient.returns.delete(requestId, password);
      setReturnRequests((prev) => prev.filter((r) => r.id !== requestId));
      setExpandedReturn(null);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    fetchReturns(password, status || undefined);
  };

  const handleRefundComplete = async (requestId: string) => {
    if (!confirm('환불 완료로 처리할까요?')) return;

    try {
      await apiClient.returns.updateStatus(requestId, password, {
        status: ReturnStatus.COMPLETED,
        refundCompleted: true,
        sendNotification: notifyOnChange,
      });

      fetchReturns(password, filterStatus || undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했습니다.');
    }
  };

  const toggleExpanded = (requestId: string) => {
    setExpandedReturn(expandedReturn === requestId ? null : requestId);
  };

  return {
    returnRequests,
    loading,
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
