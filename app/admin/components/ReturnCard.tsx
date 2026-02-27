import type { ReturnRequest } from '../types';
import { RETURN_STATUS_TRANSITIONS } from '../constants';
import { formatDate, getReturnStatusColor } from '../utils';
import { ReturnStatus } from '@/lib/domain/enums';
import { TrackingModal } from './TrackingModal';
import styles from '../admin.module.css';

interface ReturnCardProps {
  request: ReturnRequest;
  expanded: boolean;
  trackingModal: string | null;
  trackingInput: string;
  rejectModal: string | null;
  rejectReason: string;
  notifyOnChange: boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, status: string, extra?: Record<string, unknown>) => void;
  onRefundComplete: (id: string) => void;
  onDelete: (id: string, requestNumber: string) => void;
  onTrackingModalOpen: (id: string) => void;
  onTrackingInputChange: (value: string) => void;
  onTrackingCancel: () => void;
  onRejectModalOpen: (id: string) => void;
  onRejectReasonChange: (value: string) => void;
  onRejectCancel: () => void;
  onNotifyChange: (value: boolean) => void;
}

export function ReturnCard({
  request: req,
  expanded,
  trackingModal,
  trackingInput,
  rejectModal,
  rejectReason,
  notifyOnChange,
  onToggleExpand,
  onStatusChange,
  onRefundComplete,
  onDelete,
  onTrackingModalOpen,
  onTrackingInputChange,
  onTrackingCancel,
  onRejectModalOpen,
  onRejectReasonChange,
  onRejectCancel,
  onNotifyChange,
}: ReturnCardProps) {
  const nextStatuses = RETURN_STATUS_TRANSITIONS[req.status] || [];

  return (
    <div className={styles.orderCard}>
      <div
        className={styles.orderHeader}
        onClick={() => onToggleExpand(req.id)}
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

      {expanded && (
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
              <p>교환 배송비: ₩{(req.return_shipping_fee || 8000).toLocaleString()}</p>
            </div>
          )}

          {req.type === '반품' && (
            <div className={styles.detailSection}>
              <h3>환불 정보</h3>
              <p>상품 금액: ₩{(req.order_items.price * req.quantity).toLocaleString()}</p>
              <p>반품 배송비: -₩{(req.return_shipping_fee || 4000).toLocaleString()}</p>
              <p style={{ fontWeight: 700 }}>환불 금액: ₩{(req.refund_amount || req.order_items.price * req.quantity - (req.return_shipping_fee || 4000)).toLocaleString()}</p>
              <p>은행: {req.refund_bank || '-'}</p>
              <p>계좌번호: {req.refund_account || '-'}</p>
              <p>예금주: {req.refund_holder || '-'}</p>
              <p>환불 상태: {req.refund_completed ? '환불 완료' : '미완료'}</p>
            </div>
          )}

          {req.status === ReturnStatus.REJECTED && req.reject_reason && (
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
                    onChange={(e) => onNotifyChange(e.target.checked)}
                  />
                  <span>고객에게 알림 보내기</span>
                </label>
              </div>
              <div className={styles.statusButtons}>
                {nextStatuses.map((status) => {
                  if (status === ReturnStatus.REJECTED) {
                    return (
                      <button
                        key={status}
                        className={`${styles.statusButton} ${styles.rejectStatusButton}`}
                        onClick={() => onRejectModalOpen(req.id)}
                      >
                        거절
                      </button>
                    );
                  }
                  if (status === ReturnStatus.COLLECTING) {
                    return (
                      <button
                        key={status}
                        className={styles.statusButton}
                        onClick={() => onTrackingModalOpen(req.id)}
                      >
                        수거중
                      </button>
                    );
                  }
                  if (status === ReturnStatus.COMPLETED && req.type === '반품') {
                    return (
                      <button
                        key={status}
                        className={styles.statusButton}
                        onClick={() => onRefundComplete(req.id)}
                      >
                        환불 완료 처리
                      </button>
                    );
                  }
                  return (
                    <button
                      key={status}
                      className={styles.statusButton}
                      onClick={() => onStatusChange(req.id, status)}
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
                    onChange={(e) => onRejectReasonChange(e.target.value)}
                    placeholder="거절 사유를 입력하세요"
                    autoFocus
                    rows={3}
                  />
                  <div className={styles.trackingModalButtons}>
                    <button
                      className={styles.trackingCancelButton}
                      onClick={onRejectCancel}
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
                        onStatusChange(req.id, ReturnStatus.REJECTED, { rejectReason: rejectReason.trim() });
                      }}
                    >
                      거절 처리
                    </button>
                  </div>
                </div>
              )}

              {trackingModal === req.id && (
                <TrackingModal
                  title="반품 운송장번호 입력"
                  value={trackingInput}
                  onChange={onTrackingInputChange}
                  onSubmit={() => {
                    if (!trackingInput.trim()) {
                      alert('운송장번호를 입력해주세요.');
                      return;
                    }
                    onStatusChange(req.id, ReturnStatus.COLLECTING, { returnTrackingNumber: trackingInput.trim() });
                  }}
                  onCancel={onTrackingCancel}
                  submitLabel="수거중으로 변경"
                />
              )}
            </div>
          )}

          <div className={styles.dangerZone}>
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(req.id, req.request_number)}
            >
              요청 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
