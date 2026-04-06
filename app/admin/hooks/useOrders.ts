import { useState, useCallback, useMemo } from 'react';
import type { Order } from '../types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { OrderStatus } from '@/lib/domain/enums';
import { showToast } from '../lib/toast';

export function useOrders() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMarketing, setFilterMarketing] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [notifyOnChange, setNotifyOnChange] = useState(true);
  const [delayModal, setDelayModal] = useState<string | null>(null);
  const [delayWeeks, setDelayWeeks] = useState(3);
  const [delayUnit, setDelayUnit] = useState<'주' | '일'>('주');

  const orders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allOrders.filter((order) => {
      let matchStatus: boolean;
      if (filterStatus === '발송지연') {
        matchStatus = /^(\d+)(주|일) 뒤 발송$/.test(order.status);
      } else {
        matchStatus = !filterStatus || order.status === filterStatus;
      }
      const orderDate = order.created_at.split('T')[0];
      const matchFrom = !dateFrom || orderDate >= dateFrom;
      const matchTo = !dateTo || orderDate <= dateTo;
      const matchMarketing =
        filterMarketing === null || order.marketing_consent === filterMarketing;
      const matchSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.includes(q);
      return matchStatus && matchFrom && matchTo && matchMarketing && matchSearch;
    });
  }, [allOrders, filterStatus, filterMarketing, searchQuery, dateFrom, dateTo]);

  const setProcessing = (orderId: string, value: boolean) => {
    setProcessingOrders((prev) => {
      const next = new Set(prev);
      if (value) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.orders.list();
      setAllOrders(data.orders);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      showToast('주문 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    const hasEmail = order?.customer_email;
    const willNotify = notifyOnChange && hasEmail;

    const confirmMsg = willNotify
      ? `상태를 "${newStatus}"(으)로 변경하고 고객에게 알림을 보낼까요?`
      : `상태를 "${newStatus}"(으)로 변경할까요?`;

    if (!confirm(confirmMsg)) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.updateStatus(orderId, {
        status: newStatus,
        sendNotification: notifyOnChange,
        ...(trackingNumber && { trackingNumber }),
      });

      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (willNotify) {
        showToast(`상태 변경 완료! ${order.customer_email}로 알림 발송`, 'success');
      } else {
        showToast(`"${newStatus}"(으)로 변경되었습니다.`, 'success');
      }
    } catch (err) {
      showToast(`상태 변경 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handleShippingClick = (orderId: string) => {
    setTrackingModal(orderId);
    setTrackingInput('');
  };

  const handleDelayClick = (orderId: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (order) {
      const match = order.status.match(/^(\d+)(주|일) 뒤 발송$/);
      if (match) {
        setDelayWeeks(parseInt(match[1], 10));
        setDelayUnit(match[2] as '주' | '일');
      } else {
        setDelayWeeks(3);
        setDelayUnit('주');
      }
    }
    setDelayModal(orderId);
  };

  const handleDelaySubmit = () => {
    if (!delayModal) return;
    handleStatusChange(delayModal, `${delayWeeks}${delayUnit} 뒤 발송`);
    setDelayModal(null);
  };

  const handleTrackingSubmit = () => {
    if (!trackingModal) return;
    if (!trackingInput.trim()) {
      showToast('운송장번호를 입력해주세요.', 'error');
      return;
    }
    handleStatusChange(trackingModal, OrderStatus.SHIPPING, trackingInput.trim());
    setTrackingModal(null);
    setTrackingInput('');
  };

  const handlePaymentReminder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber} 고객에게 입금 안내 메일을 보낼까요?`)) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.sendPaymentReminder(orderId);
      showToast('입금 안내 메일이 발송되었습니다.', 'success');
    } catch (err) {
      showToast(`메일 발송 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber}을(를) 정말 삭제할까요?\n삭제하면 복구할 수 없습니다.`)) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.delete(orderId);
      setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
      setExpandedOrder(null);
      showToast('주문이 삭제되었습니다.', 'success');
    } catch {
      showToast('주문 삭제에 실패했습니다.', 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleRevokeMarketing = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber} 고객의 마케팅 수신 동의를 철회할까요?`)) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.revokeMarketing(orderId);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, marketing_consent: false } : o))
      );
      showToast('마케팅 동의가 철회되었습니다.', 'success');
    } catch (err) {
      showToast(`마케팅 동의 철회 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return {
    orders,
    allOrders,
    loading,
    processingOrders,
    filterStatus,
    filterMarketing,
    setFilterMarketing,
    searchQuery,
    setSearchQuery,
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
    delayUnit,
    setDelayWeeks,
    setDelayUnit,
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
    handleRevokeMarketing,
    toggleExpanded,
  };
}
