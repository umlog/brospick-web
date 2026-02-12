import { useState, useCallback } from 'react';
import type { Order } from '../types';

export function useOrders(password: string, onAuthFailure: () => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [notifyOnChange, setNotifyOnChange] = useState(true);

  const fetchOrders = useCallback(async (pw: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const response = await fetch(`/api/orders?${params}`, {
        headers: { 'x-admin-password': pw },
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert('비밀번호가 올바르지 않습니다.');
          onAuthFailure();
          return;
        }
        throw new Error('주문 조회 실패');
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch {
      alert('주문 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [onAuthFailure]);

  const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    const order = orders.find((o) => o.id === orderId);
    const hasEmail = order?.customer_email;
    const willNotify = notifyOnChange && hasEmail;

    const confirmMsg = willNotify
      ? `상태를 "${newStatus}"(으)로 변경하고 고객에게 알림을 보낼까요?`
      : `상태를 "${newStatus}"(으)로 변경할까요?`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          status: newStatus,
          sendNotification: notifyOnChange,
          ...(trackingNumber && { trackingNumber }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `서버 오류 (${response.status})`);
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (willNotify) {
        alert(`상태 변경 완료! ${order.customer_email}로 알림을 발송했습니다.`);
      }
    } catch (err) {
      alert(`상태 변경에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const handleShippingClick = (orderId: string) => {
    setTrackingModal(orderId);
    setTrackingInput('');
  };

  const handleTrackingSubmit = () => {
    if (!trackingModal) return;
    if (!trackingInput.trim()) {
      alert('운송장번호를 입력해주세요.');
      return;
    }
    handleStatusChange(trackingModal, '배송중', trackingInput.trim());
    setTrackingModal(null);
    setTrackingInput('');
  };

  const handlePaymentReminder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber} 고객에게 입금 안내 메일을 보낼까요?`)) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `서버 오류 (${response.status})`);
      }

      alert('입금 안내 메일이 발송되었습니다.');
    } catch (err) {
      alert(`메일 발송 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber}을(를) 정말 삭제할까요?\n삭제하면 복구할 수 없습니다.`)) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (!response.ok) throw new Error('삭제 실패');

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setExpandedOrder(null);
    } catch {
      alert('주문 삭제에 실패했습니다.');
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    fetchOrders(password, status || undefined);
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return {
    orders,
    loading,
    filterStatus,
    expandedOrder,
    trackingModal,
    trackingInput,
    notifyOnChange,
    setTrackingInput,
    setTrackingModal,
    setNotifyOnChange,
    fetchOrders,
    handleStatusChange,
    handleShippingClick,
    handleTrackingSubmit,
    handlePaymentReminder,
    handleDeleteOrder,
    handleFilterChange,
    toggleExpanded,
  };
}
