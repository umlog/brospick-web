import { useState, useCallback, useMemo } from 'react';
import type { Order } from '../types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { OrderStatus } from '@/lib/domain/enums';

export function useOrders(password: string, onAuthFailure: () => void) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [notifyOnChange, setNotifyOnChange] = useState(true);
  const [delayModal, setDelayModal] = useState<string | null>(null);
  const [delayWeeks, setDelayWeeks] = useState(3);

  const orders = useMemo(() => {
    return allOrders.filter((order) => {
      let matchStatus: boolean;
      if (filterStatus === '발송지연') {
        matchStatus = /^\d+주 뒤 발송$/.test(order.status);
      } else {
        matchStatus = !filterStatus || order.status === filterStatus;
      }
      const orderDate = order.created_at.split('T')[0];
      const matchFrom = !dateFrom || orderDate >= dateFrom;
      const matchTo = !dateTo || orderDate <= dateTo;
      return matchStatus && matchFrom && matchTo;
    });
  }, [allOrders, filterStatus, dateFrom, dateTo]);

  const fetchOrders = useCallback(async (pw: string) => {
    setLoading(true);
    try {
      const data = await apiClient.orders.list(pw);
      setAllOrders(data.orders);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        alert('비밀번호가 올바르지 않습니다.');
        onAuthFailure();
        return;
      }
      alert('주문 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [onAuthFailure]);

  const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    const hasEmail = order?.customer_email;
    const willNotify = notifyOnChange && hasEmail;

    const confirmMsg = willNotify
      ? `상태를 "${newStatus}"(으)로 변경하고 고객에게 알림을 보낼까요?`
      : `상태를 "${newStatus}"(으)로 변경할까요?`;

    if (!confirm(confirmMsg)) return;

    try {
      await apiClient.orders.updateStatus(orderId, password, {
        status: newStatus,
        sendNotification: notifyOnChange,
        ...(trackingNumber && { trackingNumber }),
      });

      setAllOrders((prev) =>
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

  const handleDelayClick = (orderId: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (order) {
      const match = order.status.match(/^(\d+)주 뒤 발송$/);
      setDelayWeeks(match ? parseInt(match[1], 10) : 3);
    }
    setDelayModal(orderId);
  };

  const handleDelaySubmit = () => {
    if (!delayModal) return;
    handleStatusChange(delayModal, `${delayWeeks}주 뒤 발송`);
    setDelayModal(null);
  };

  const handleTrackingSubmit = () => {
    if (!trackingModal) return;
    if (!trackingInput.trim()) {
      alert('운송장번호를 입력해주세요.');
      return;
    }
    handleStatusChange(trackingModal, OrderStatus.SHIPPING, trackingInput.trim());
    setTrackingModal(null);
    setTrackingInput('');
  };

  const handlePaymentReminder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber} 고객에게 입금 안내 메일을 보낼까요?`)) return;

    try {
      await apiClient.orders.sendPaymentReminder(orderId, password);
      alert('입금 안내 메일이 발송되었습니다.');
    } catch (err) {
      alert(`메일 발송 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber}을(를) 정말 삭제할까요?\n삭제하면 복구할 수 없습니다.`)) return;

    try {
      await apiClient.orders.delete(orderId, password);
      setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
      setExpandedOrder(null);
    } catch {
      alert('주문 삭제에 실패했습니다.');
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return {
    orders,
    allOrders,
    loading,
    filterStatus,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    expandedOrder,
    trackingModal,
    trackingInput,
    notifyOnChange,
    setTrackingInput,
    setTrackingModal,
    setNotifyOnChange,
    delayModal,
    delayWeeks,
    setDelayWeeks,
    setDelayModal,
    fetchOrders,
    handleStatusChange,
    handleShippingClick,
    handleTrackingSubmit,
    handleDelayClick,
    handleDelaySubmit,
    handlePaymentReminder,
    handleDeleteOrder,
    handleFilterChange,
    toggleExpanded,
  };
}
