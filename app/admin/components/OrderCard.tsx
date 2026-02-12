import type { Order } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { formatDate, getStatusColor } from '../utils';
import { TrackingModal } from './TrackingModal';
import styles from '../admin.module.css';

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  trackingModal: string | null;
  trackingInput: string;
  notifyOnChange: boolean;
  onToggleExpand: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onShippingClick: (orderId: string) => void;
  onTrackingSubmit: () => void;
  onTrackingInputChange: (value: string) => void;
  onTrackingCancel: () => void;
  onNotifyChange: (value: boolean) => void;
  onPaymentReminder: (orderId: string, orderNumber: string) => void;
  onDelete: (orderId: string, orderNumber: string) => void;
}

export function OrderCard({
  order,
  expanded,
  trackingModal,
  trackingInput,
  notifyOnChange,
  onToggleExpand,
  onStatusChange,
  onShippingClick,
  onTrackingSubmit,
  onTrackingInputChange,
  onTrackingCancel,
  onNotifyChange,
  onPaymentReminder,
  onDelete,
}: OrderCardProps) {
  return (
    <div className={styles.orderCard}>
      <div
        className={styles.orderHeader}
        onClick={() => onToggleExpand(order.id)}
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

      {expanded && (
        <div className={styles.orderDetail}>
          <div className={styles.detailSection}>
            <h3>고객 정보</h3>
            <p>이름: {order.customer_name}</p>
            <p>전화: {order.customer_phone}</p>
            {order.customer_email && <p>이메일: {order.customer_email}</p>}
            <p>주소: [{order.postal_code}] {order.address} {order.address_detail || ''}</p>
            {order.delivery_note && <p>배송 요청사항: {order.delivery_note}</p>}
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
                  onChange={(e) => onNotifyChange(e.target.checked)}
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
                      ? onShippingClick(order.id)
                      : onStatusChange(order.id, status)
                  }
                  disabled={order.status === status}
                >
                  {status}
                </button>
              ))}
            </div>

            {trackingModal === order.id && (
              <TrackingModal
                title="운송장번호 입력"
                value={trackingInput}
                onChange={onTrackingInputChange}
                onSubmit={onTrackingSubmit}
                onCancel={onTrackingCancel}
                submitLabel="배송중으로 변경"
                showCarrierSelect
              />
            )}
          </div>

          {order.status === '입금대기' && order.customer_email && (
            <div className={styles.paymentReminder}>
              <button
                className={styles.paymentReminderButton}
                onClick={() => onPaymentReminder(order.id, order.order_number)}
              >
                입금 안내 메일 보내기
              </button>
            </div>
          )}

          <div className={styles.dangerZone}>
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(order.id, order.order_number)}
            >
              주문 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
