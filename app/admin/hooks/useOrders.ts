import { useState, useCallback, useMemo } from 'react';
import type { Order } from '../types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import { OrderStatus } from '@/lib/domain/enums';
import { TRACKING } from '@/lib/constants';

// 로젠 운송장 일괄 등록 대상에서 제외할 상태 (이미 배송됐거나 취소된 건)
export const TRACKING_IMPORT_SKIP_STATUSES: string[] = [
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCEL_REQUESTED,
  OrderStatus.CANCELLED,
];

// 일괄 변경 가능한 상태 (운송장·날짜 입력 불필요한 것만)
export const BULK_ELIGIBLE_STATUSES = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.DELIVERED,
] as const;

const BULK_SKIP_STATUSES: string[] = [OrderStatus.CANCEL_REQUESTED, OrderStatus.CANCELLED];

export function useOrders(notifyOnChange: boolean) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMarketing, setFilterMarketing] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string, carrier?: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    const hasEmail = order?.customer_email;
    const willNotify = notifyOnChange && hasEmail;

    const confirmMsg = willNotify
      ? `상태를 "${newStatus}"(으)로 변경하고 고객에게 알림을 보낼까요?`
      : `상태를 "${newStatus}"(으)로 변경할까요?`;

    const ok = await showConfirm(confirmMsg);
    if (!ok) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.updateStatus(orderId, {
        status: newStatus,
        sendNotification: notifyOnChange,
        ...(trackingNumber && { trackingNumber }),
        ...(carrier && { carrier }),
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

  const handlePaymentReminder = async (orderId: string, orderNumber: string) => {
    const ok = await showConfirm(`주문 ${orderNumber} 고객에게 입금 안내 메일을 보낼까요?`);
    if (!ok) return;

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
    const ok = await showConfirm(`주문 ${orderNumber}을(를) 휴지통으로 이동할까요?\n언제든지 복구할 수 있습니다.`);
    if (!ok) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.delete(orderId);
      setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('주문이 휴지통으로 이동되었습니다.', 'success');
    } catch {
      showToast('주문 삭제에 실패했습니다.', 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  // ── 휴지통 ──────────────────────────────────────────
  const [trashMode, setTrashMode] = useState(false);
  const [trashedOrders, setTrashedOrders] = useState<Order[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const fetchTrashedOrders = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await apiClient.orders.listTrashed();
      setTrashedOrders(data.orders);
    } catch {
      showToast('휴지통 조회에 실패했습니다.', 'error');
    } finally {
      setTrashLoading(false);
    }
  }, []);

  const handleRestoreOrder = async (orderId: string, orderNumber: string) => {
    const ok = await showConfirm(`주문 ${orderNumber}을(를) 복구할까요?`);
    if (!ok) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.restore(orderId);
      setTrashedOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('주문이 복구되었습니다.', 'success');
    } catch {
      showToast('복구에 실패했습니다.', 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handlePermanentDelete = async (orderId: string, orderNumber: string) => {
    const ok = await showConfirm(`주문 ${orderNumber}을(를) 영구 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`);
    if (!ok) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.permanentDelete(orderId);
      setTrashedOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('영구 삭제되었습니다.', 'success');
    } catch {
      showToast('영구 삭제에 실패했습니다.', 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handleCancelRefundComplete = async (orderId: string, orderNumber: string) => {
    const ok = await showConfirm(`주문 ${orderNumber} 환불을 완료 처리할까요?`);
    if (!ok) return;

    setProcessing(orderId, true);
    try {
      await apiClient.orders.updateStatus(orderId, {
        status: '취소완료',
        sendNotification: false,
      });
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: '취소완료', cancel_refund_completed: true } : o))
      );
      showToast('환불 완료 처리되었습니다.', 'success');
    } catch (err) {
      showToast(`처리 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setProcessing(orderId, false);
    }
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAllVisible = () => setSelectedOrders(new Set(orders.map((o) => o.id)));

  const clearSelection = () => setSelectedOrders(new Set());

  const handleBulkStatusChange = async (newStatus: string) => {
    const selected = orders.filter((o) => selectedOrders.has(o.id));
    const toChange = selected.filter(
      (o) => o.status !== newStatus && !BULK_SKIP_STATUSES.includes(o.status)
    );
    const skipped = selected.length - toChange.length;

    if (toChange.length === 0) {
      showToast('변경 가능한 주문이 없습니다.', 'info');
      return;
    }

    const notifyCount = notifyOnChange ? toChange.filter((o) => o.customer_email).length : 0;
    let msg = `${toChange.length}건을 "${newStatus}"(으)로 변경할까요?`;
    if (notifyCount > 0) msg += `\n이메일 알림 ${notifyCount}건 발송됩니다.`;
    if (skipped > 0) msg += `\n(${skipped}건은 상태가 맞지 않아 건너뜁니다)`;

    const ok = await showConfirm(msg);
    if (!ok) return;

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      toChange.forEach((o) => next.add(o.id));
      return next;
    });

    const results = await Promise.allSettled(
      toChange.map((order) =>
        apiClient.orders.updateStatus(order.id, {
          status: newStatus,
          sendNotification: notifyOnChange,
        })
      )
    );

    const successIds = new Set<string>();
    let failCount = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') successIds.add(toChange[i].id);
      else failCount++;
    });

    if (successIds.size > 0) {
      setAllOrders((prev) =>
        prev.map((o) => (successIds.has(o.id) ? { ...o, status: newStatus } : o))
      );
    }

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      toChange.forEach((o) => next.delete(o.id));
      return next;
    });

    setSelectedOrders(new Set());

    if (failCount === 0) {
      showToast(
        `${successIds.size}건 변경 완료${skipped > 0 ? ` (${skipped}건 건너뜀)` : ''}`,
        'success'
      );
    } else {
      showToast(`${successIds.size}건 성공, ${failCount}건 실패`, 'error');
    }
  };

  const handleBulkDelete = async () => {
    const selected = orders.filter((o) => selectedOrders.has(o.id));
    if (selected.length === 0) return;

    const ok = await showConfirm(`선택한 ${selected.length}건을 휴지통으로 이동할까요?\n언제든지 복구할 수 있습니다.`);
    if (!ok) return;

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      selected.forEach((o) => next.add(o.id));
      return next;
    });

    const results = await Promise.allSettled(
      selected.map((order) => apiClient.orders.delete(order.id))
    );

    const successIds = new Set<string>();
    let failCount = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') successIds.add(selected[i].id);
      else failCount++;
    });

    if (successIds.size > 0) {
      setAllOrders((prev) => prev.filter((o) => !successIds.has(o.id)));
    }

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      selected.forEach((o) => next.delete(o.id));
      return next;
    });

    setSelectedOrders(new Set());

    if (failCount === 0) {
      showToast(`${successIds.size}건이 휴지통으로 이동되었습니다.`, 'success');
    } else {
      showToast(`${successIds.size}건 성공, ${failCount}건 실패`, 'error');
    }
  };

  // 로젠 결과 엑셀 → 매칭 확정된 주문에 운송장 일괄 등록 (배송중 전환)
  // items: 미리보기 화면에서 사용자가 직접 선택·확인한 건만 넘어온다.
  const handleBulkTrackingImport = async (
    items: { orderId: string; trackingNumber: string }[],
    sendNotification: boolean
  ): Promise<{ success: number; fail: number }> => {
    if (items.length === 0) return { success: 0, fail: 0 };

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      items.forEach((it) => next.add(it.orderId));
      return next;
    });

    const results = await Promise.allSettled(
      items.map((it) =>
        apiClient.orders.updateStatus(it.orderId, {
          status: OrderStatus.SHIPPING,
          sendNotification,
          trackingNumber: it.trackingNumber,
          carrier: TRACKING.defaultCarrier,
        })
      )
    );

    const successIds = new Set<string>();
    let failCount = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') successIds.add(items[i].orderId);
      else failCount++;
    });

    if (successIds.size > 0) {
      setAllOrders((prev) =>
        prev.map((o) =>
          successIds.has(o.id) ? { ...o, status: OrderStatus.SHIPPING } : o
        )
      );
    }

    setProcessingOrders((prev) => {
      const next = new Set(prev);
      items.forEach((it) => next.delete(it.orderId));
      return next;
    });

    if (failCount === 0) {
      showToast(`${successIds.size}건 배송중 등록 완료`, 'success');
    } else {
      showToast(`${successIds.size}건 성공, ${failCount}건 실패`, 'error');
    }

    return { success: successIds.size, fail: failCount };
  };

  const handleRevokeMarketing = async (orderId: string, orderNumber: string) => {
    const ok = await showConfirm(`주문 ${orderNumber} 고객의 마케팅 수신 동의를 철회할까요?`);
    if (!ok) return;

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

  return {
    orders,
    allOrders,
    loading,
    processingOrders,
    selectedOrders,
    filterStatus,
    filterMarketing,
    setFilterMarketing,
    searchQuery,
    setSearchQuery,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    fetchOrders,
    handleStatusChange,
    handlePaymentReminder,
    handleDeleteOrder,
    handleFilterChange,
    handleRevokeMarketing,
    handleCancelRefundComplete,
    toggleSelectOrder,
    selectAllVisible,
    clearSelection,
    handleBulkStatusChange,
    handleBulkDelete,
    handleBulkTrackingImport,
    // 휴지통
    trashMode,
    setTrashMode,
    trashedOrders,
    trashLoading,
    fetchTrashedOrders,
    handleRestoreOrder,
    handlePermanentDelete,
  };
}
