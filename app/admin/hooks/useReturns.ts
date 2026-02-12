import { useState, useCallback } from 'react';
import type { ReturnRequest } from '../types';

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
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const response = await fetch(`/api/returns?${params}`, {
        headers: { 'x-admin-password': pw },
      });
      if (!response.ok) throw new Error('교환/반품 조회 실패');

      const data = await response.json();
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
      const response = await fetch(`/api/returns/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          status: newStatus,
          sendNotification: notifyOnChange,
          ...extra,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '상태 변경에 실패했습니다.');
        return;
      }

      fetchReturns(password, filterStatus || undefined);
      setRejectModal(null);
      setRejectReason('');
      setTrackingModal(null);
      setTrackingInput('');
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (requestId: string, requestNumber: string) => {
    if (!confirm(`요청 ${requestNumber}을(를) 정말 삭제할까요?`)) return;

    try {
      const response = await fetch(`/api/returns/${requestId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (!response.ok) throw new Error('삭제 실패');

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
      const response = await fetch(`/api/returns/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          status: '처리완료',
          refundCompleted: true,
          sendNotification: notifyOnChange,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '처리에 실패했습니다.');
        return;
      }

      fetchReturns(password, filterStatus || undefined);
    } catch {
      alert('처리에 실패했습니다.');
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
