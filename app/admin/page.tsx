'use client';

import { useState, useCallback } from 'react';
import styles from './admin.module.css';

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  postal_code: string;
  address: string;
  address_detail: string | null;
  total_amount: number;
  shipping_fee: number;
  status: string;
  depositor_name: string | null;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

interface ReturnRequest {
  id: string;
  request_number: string;
  type: '교환' | '반품';
  reason: string;
  status: string;
  exchange_size: string | null;
  quantity: number;
  reject_reason: string | null;
  refund_amount: number | null;
  refund_bank: string | null;
  refund_account: string | null;
  refund_holder: string | null;
  refund_completed: boolean;
  return_tracking_number: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    address: string;
    address_detail: string | null;
    postal_code: string;
  };
  order_items: {
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  };
}

type AdminTab = 'orders' | 'returns';

const STATUS_OPTIONS = ['입금대기', '입금확인', '배송중', '배송완료'];
const RETURN_STATUS_OPTIONS = ['접수완료', '승인', '수거중', '수거완료', '처리완료', '거절'];

const RETURN_STATUS_TRANSITIONS: Record<string, string[]> = {
  '접수완료': ['승인', '거절'],
  '승인': ['수거중'],
  '수거중': ['수거완료'],
  '수거완료': ['처리완료'],
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // 주문 관리 상태
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  // 교환/반품 관리 상태
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnFilterStatus, setReturnFilterStatus] = useState('');
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [returnTrackingModal, setReturnTrackingModal] = useState<string | null>(null);
  const [returnTrackingInput, setReturnTrackingInput] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
          setIsAuthenticated(false);
          return;
        }
        throw new Error('주문 조회 실패');
      }

      const data = await response.json();
      setOrders(data.orders);
      setIsAuthenticated(true);
    } catch {
      alert('주문 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturns = useCallback(async (pw: string, status?: string) => {
    setReturnLoading(true);
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
      setReturnLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(password);
  };

  const [notifyOnChange, setNotifyOnChange] = useState(true);

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

      if (!response.ok) throw new Error('상태 변경 실패');

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (willNotify) {
        alert(`상태 변경 완료! ${order.customer_email}로 알림을 발송했습니다.`);
      }
    } catch {
      alert('상태 변경에 실패했습니다.');
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

  // 교환/반품 상태 변경
  const handleReturnStatusChange = async (requestId: string, newStatus: string, extra?: Record<string, unknown>) => {
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

      fetchReturns(password, returnFilterStatus || undefined);
      setRejectModal(null);
      setRejectReason('');
      setReturnTrackingModal(null);
      setReturnTrackingInput('');
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleReturnDelete = async (requestId: string, requestNumber: string) => {
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

  const handleReturnFilterChange = (status: string) => {
    setReturnFilterStatus(status);
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

      fetchReturns(password, returnFilterStatus || undefined);
    } catch {
      alert('처리에 실패했습니다.');
    }
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'returns' && returnRequests.length === 0) {
      fetchReturns(password);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '입금대기': return styles.statusPending;
      case '입금확인': return styles.statusConfirmed;
      case '배송준비': return styles.statusPreparing;
      case '배송중': return styles.statusShipping;
      case '배송완료': return styles.statusDelivered;
      default: return '';
    }
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case '접수완료': return styles.returnStatusReceived;
      case '승인': return styles.returnStatusApproved;
      case '수거중': return styles.returnStatusCollecting;
      case '수거완료': return styles.returnStatusCollected;
      case '처리완료': return styles.returnStatusComplete;
      case '거절': return styles.returnStatusRejected;
      default: return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.main}>
        <div className={styles.loginContainer}>
          <h1>관리자 로그인</h1>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
            />
            <button type="submit">로그인</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{activeTab === 'orders' ? '주문 관리' : '교환/반품 관리'}</h1>
          <button
            onClick={() =>
              activeTab === 'orders'
                ? fetchOrders(password, filterStatus || undefined)
                : fetchReturns(password, returnFilterStatus || undefined)
            }
            className={styles.refreshButton}
          >
            새로고침
          </button>
        </div>

        {/* 탭 */}
        <div className={styles.adminTabs}>
          <button
            className={`${styles.adminTab} ${activeTab === 'orders' ? styles.adminTabActive : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            주문 관리
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'returns' ? styles.adminTabActive : ''}`}
            onClick={() => handleTabChange('returns')}
          >
            교환/반품
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            <div className={styles.filters}>
              <button
                className={`${styles.filterButton} ${filterStatus === '' ? styles.filterActive : ''}`}
                onClick={() => handleFilterChange('')}
              >
                전체
              </button>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={`${styles.filterButton} ${filterStatus === status ? styles.filterActive : ''}`}
                  onClick={() => handleFilterChange(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {loading ? (
              <p className={styles.loading}>로딩 중...</p>
            ) : orders.length === 0 ? (
              <p className={styles.empty}>주문이 없습니다.</p>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div
                      className={styles.orderHeader}
                      onClick={() =>
                        setExpandedOrder(expandedOrder === order.id ? null : order.id)
                      }
                    >
                      <div className={styles.orderMeta}>
                        <span className={styles.orderNumber}>{order.order_number}</span>
                        <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                      </div>
                      <div className={styles.orderQuick}>
                        <span className={styles.orderCustomer}>{order.customer_name}</span>
                        <span className={styles.orderAmount}>
                          ₩{order.total_amount.toLocaleString()}
                        </span>
                        <span className={`${styles.statusBadge} ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className={styles.orderDetail}>
                        <div className={styles.detailSection}>
                          <h3>고객 정보</h3>
                          <p>이름: {order.customer_name}</p>
                          <p>전화: {order.customer_phone}</p>
                          {order.customer_email && <p>이메일: {order.customer_email}</p>}
                          <p>주소: [{order.postal_code}] {order.address} {order.address_detail || ''}</p>
                        </div>

                        <div className={styles.detailSection}>
                          <h3>결제 정보</h3>
                          <p>결제방법: {order.payment_method}</p>
                          <p>입금자명: {order.depositor_name || '-'}</p>
                          <p>상품금액: ₩{(order.total_amount - order.shipping_fee).toLocaleString()}</p>
                          <p>배송비: ₩{order.shipping_fee.toLocaleString()}</p>
                          <p>총액: ₩{order.total_amount.toLocaleString()}</p>
                        </div>

                        <div className={styles.detailSection}>
                          <h3>주문 상품</h3>
                          {order.order_items.map((item) => (
                            <div key={item.id} className={styles.detailItem}>
                              <span>{item.product_name} ({item.size})</span>
                              <span>{item.quantity}개 × ₩{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className={styles.statusControl}>
                          <div className={styles.statusHeader}>
                            <h3>상태 변경</h3>
                            <label className={styles.notifyToggle}>
                              <input
                                type="checkbox"
                                checked={notifyOnChange}
                                onChange={(e) => setNotifyOnChange(e.target.checked)}
                              />
                              <span>고객에게 알림 보내기</span>
                              {!order.customer_email && (
                                <span className={styles.noEmail}>(이메일 없음)</span>
                              )}
                            </label>
                          </div>
                          <div className={styles.statusButtons}>
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                className={`${styles.statusButton} ${order.status === status ? styles.statusButtonActive : ''}`}
                                onClick={() =>
                                  status === '배송중'
                                    ? handleShippingClick(order.id)
                                    : handleStatusChange(order.id, status)
                                }
                                disabled={order.status === status}
                              >
                                {status}
                              </button>
                            ))}
                          </div>

                          {trackingModal === order.id && (
                            <div className={styles.trackingModal}>
                              <h4>운송장번호 입력</h4>
                              <input
                                type="text"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                placeholder="운송장번호를 입력하세요"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleTrackingSubmit();
                                }}
                              />
                              <div className={styles.trackingModalButtons}>
                                <button
                                  className={styles.trackingCancelButton}
                                  onClick={() => setTrackingModal(null)}
                                >
                                  취소
                                </button>
                                <button
                                  className={styles.trackingConfirmButton}
                                  onClick={handleTrackingSubmit}
                                >
                                  배송중으로 변경
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={styles.dangerZone}>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          >
                            주문 삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* 교환/반품 필터 */}
            <div className={styles.filters}>
              <button
                className={`${styles.filterButton} ${returnFilterStatus === '' ? styles.filterActive : ''}`}
                onClick={() => handleReturnFilterChange('')}
              >
                전체
              </button>
              {RETURN_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={`${styles.filterButton} ${returnFilterStatus === status ? styles.filterActive : ''}`}
                  onClick={() => handleReturnFilterChange(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* 교환/반품 목록 */}
            {returnLoading ? (
              <p className={styles.loading}>로딩 중...</p>
            ) : returnRequests.length === 0 ? (
              <p className={styles.empty}>교환/반품 요청이 없습니다.</p>
            ) : (
              <div className={styles.orderList}>
                {returnRequests.map((req) => {
                  const nextStatuses = RETURN_STATUS_TRANSITIONS[req.status] || [];
                  return (
                    <div key={req.id} className={styles.orderCard}>
                      <div
                        className={styles.orderHeader}
                        onClick={() =>
                          setExpandedReturn(expandedReturn === req.id ? null : req.id)
                        }
                      >
                        <div className={styles.orderMeta}>
                          <span className={styles.orderNumber}>{req.request_number}</span>
                          <span className={styles.orderDate}>{formatDate(req.created_at)}</span>
                        </div>
                        <div className={styles.orderQuick}>
                          <span className={styles.orderCustomer}>{req.orders.customer_name}</span>
                          <span className={`${styles.typeBadge} ${req.type === '교환' ? styles.typeBadgeExchange : styles.typeBadgeReturn}`}>
                            {req.type}
                          </span>
                          <span className={`${styles.statusBadge} ${getReturnStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {expandedReturn === req.id && (
                        <div className={styles.orderDetail}>
                          <div className={styles.detailSection}>
                            <h3>요청 정보</h3>
                            <p>유형: {req.type}</p>
                            <p>상품: {req.order_items.product_name} ({req.order_items.size})</p>
                            <p>수량: {req.quantity}개</p>
                            <p>주문번호: {req.orders.order_number}</p>
                            <p>사유: {req.reason}</p>
                          </div>

                          {req.type === '교환' && req.exchange_size && (
                            <div className={styles.detailSection}>
                              <h3>교환 정보</h3>
                              <p>현재 사이즈: {req.order_items.size}</p>
                              <p>희망 사이즈: {req.exchange_size}</p>
                            </div>
                          )}

                          {req.type === '반품' && (
                            <div className={styles.detailSection}>
                              <h3>환불 정보</h3>
                              <p>환불 금액: ₩{(req.refund_amount || req.order_items.price * req.quantity).toLocaleString()}</p>
                              <p>은행: {req.refund_bank || '-'}</p>
                              <p>계좌번호: {req.refund_account || '-'}</p>
                              <p>예금주: {req.refund_holder || '-'}</p>
                              <p>환불 상태: {req.refund_completed ? '환불 완료' : '미완료'}</p>
                            </div>
                          )}

                          {req.status === '거절' && req.reject_reason && (
                            <div className={styles.detailSection}>
                              <h3>거절 사유</h3>
                              <p>{req.reject_reason}</p>
                            </div>
                          )}

                          {req.return_tracking_number && (
                            <div className={styles.detailSection}>
                              <h3>반품 운송장</h3>
                              <p style={{ fontFamily: 'monospace' }}>{req.return_tracking_number}</p>
                            </div>
                          )}

                          <div className={styles.detailSection}>
                            <h3>고객 정보</h3>
                            <p>이름: {req.orders.customer_name}</p>
                            <p>전화: {req.orders.customer_phone}</p>
                            {req.orders.customer_email && <p>이메일: {req.orders.customer_email}</p>}
                            <p>주소: [{req.orders.postal_code}] {req.orders.address} {req.orders.address_detail || ''}</p>
                          </div>

                          {nextStatuses.length > 0 && (
                            <div className={styles.statusControl}>
                              <div className={styles.statusHeader}>
                                <h3>상태 변경</h3>
                                <label className={styles.notifyToggle}>
                                  <input
                                    type="checkbox"
                                    checked={notifyOnChange}
                                    onChange={(e) => setNotifyOnChange(e.target.checked)}
                                  />
                                  <span>고객에게 알림 보내기</span>
                                </label>
                              </div>
                              <div className={styles.statusButtons}>
                                {nextStatuses.map((status) => {
                                  if (status === '거절') {
                                    return (
                                      <button
                                        key={status}
                                        className={`${styles.statusButton} ${styles.rejectStatusButton}`}
                                        onClick={() => { setRejectModal(req.id); setRejectReason(''); }}
                                      >
                                        거절
                                      </button>
                                    );
                                  }
                                  if (status === '수거중') {
                                    return (
                                      <button
                                        key={status}
                                        className={styles.statusButton}
                                        onClick={() => { setReturnTrackingModal(req.id); setReturnTrackingInput(''); }}
                                      >
                                        수거중
                                      </button>
                                    );
                                  }
                                  if (status === '처리완료' && req.type === '반품') {
                                    return (
                                      <button
                                        key={status}
                                        className={styles.statusButton}
                                        onClick={() => handleRefundComplete(req.id)}
                                      >
                                        환불 완료 처리
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      key={status}
                                      className={styles.statusButton}
                                      onClick={() => handleReturnStatusChange(req.id, status)}
                                    >
                                      {status}
                                    </button>
                                  );
                                })}
                              </div>

                              {rejectModal === req.id && (
                                <div className={styles.trackingModal}>
                                  <h4>거절 사유 입력</h4>
                                  <textarea
                                    className={styles.rejectTextarea}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="거절 사유를 입력하세요"
                                    autoFocus
                                    rows={3}
                                  />
                                  <div className={styles.trackingModalButtons}>
                                    <button
                                      className={styles.trackingCancelButton}
                                      onClick={() => setRejectModal(null)}
                                    >
                                      취소
                                    </button>
                                    <button
                                      className={styles.trackingConfirmButton}
                                      onClick={() => {
                                        if (!rejectReason.trim()) {
                                          alert('거절 사유를 입력해주세요.');
                                          return;
                                        }
                                        handleReturnStatusChange(req.id, '거절', { rejectReason: rejectReason.trim() });
                                      }}
                                    >
                                      거절 처리
                                    </button>
                                  </div>
                                </div>
                              )}

                              {returnTrackingModal === req.id && (
                                <div className={styles.trackingModal}>
                                  <h4>반품 운송장번호 입력</h4>
                                  <input
                                    type="text"
                                    value={returnTrackingInput}
                                    onChange={(e) => setReturnTrackingInput(e.target.value)}
                                    placeholder="운송장번호를 입력하세요"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (!returnTrackingInput.trim()) {
                                          alert('운송장번호를 입력해주세요.');
                                          return;
                                        }
                                        handleReturnStatusChange(req.id, '수거중', { returnTrackingNumber: returnTrackingInput.trim() });
                                      }
                                    }}
                                  />
                                  <div className={styles.trackingModalButtons}>
                                    <button
                                      className={styles.trackingCancelButton}
                                      onClick={() => setReturnTrackingModal(null)}
                                    >
                                      취소
                                    </button>
                                    <button
                                      className={styles.trackingConfirmButton}
                                      onClick={() => {
                                        if (!returnTrackingInput.trim()) {
                                          alert('운송장번호를 입력해주세요.');
                                          return;
                                        }
                                        handleReturnStatusChange(req.id, '수거중', { returnTrackingNumber: returnTrackingInput.trim() });
                                      }}
                                    >
                                      수거중으로 변경
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className={styles.dangerZone}>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleReturnDelete(req.id, req.request_number)}
                            >
                              요청 삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
