'use client';

import type { EbookOrder } from '@/lib/domain/types';
import { formatDate } from '../utils';
import styles from '../admin.module.css';

interface Props {
  orders: EbookOrder[];
  loading: boolean;
  processing: Set<number>;
  onConfirm: (id: number, orderNumber: string) => void;
  onSendLink: (id: number, orderNumber: string, name: string) => void;
  onDelete: (id: number, orderNumber: string) => void;
}

const STATUS_LABEL: Record<EbookOrder['status'], string> = {
  pending_payment: '입금 대기',
  payment_confirmed: '입금 확인',
  download_sent: '발송 완료',
};

const STATUS_COLOR: Record<EbookOrder['status'], string> = {
  pending_payment: '#ff9500',
  payment_confirmed: '#007aff',
  download_sent: '#34c759',
};

export function EbookOrderList({ orders, loading, processing, onConfirm, onSendLink, onDelete }: Props) {
  if (loading) {
    return <p className={styles.loading}>불러오는 중...</p>;
  }

  if (orders.length === 0) {
    return <p className={styles.empty}>전자책 주문이 없습니다.</p>;
  }

  const counts = {
    pending: orders.filter((o) => o.status === 'pending_payment').length,
    confirmed: orders.filter((o) => o.status === 'payment_confirmed').length,
    sent: orders.filter((o) => o.status === 'download_sent').length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'pending_payment')
    .reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <div className={styles.ebookStats}>
        {[
          { label: '입금 대기', count: counts.pending, color: STATUS_COLOR.pending_payment },
          { label: '입금 확인', count: counts.confirmed, color: STATUS_COLOR.payment_confirmed },
          { label: '발송 완료', count: counts.sent, color: STATUS_COLOR.download_sent },
        ].map(({ label, count, color }) => (
          <div key={label} className={styles.ebookStatCard}>
            <span className={styles.ebookStatLabel}>{label}</span>
            <span className={styles.ebookStatCount} style={{ color }}>{count}</span>
          </div>
        ))}
        <div className={styles.ebookStatCard}>
          <span className={styles.ebookStatLabel}>총 매출</span>
          <span className={styles.ebookStatCount}>₩{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.ebookOrders}>
        {orders.map((order) => {
          const isProc = processing.has(order.id);
          return (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.ebookOrderHeader}>
                <div>
                  <span className={styles.ebookOrderNumber}>{order.order_number}</span>
                  <span
                    className={styles.ebookStatusBadge}
                    style={{ background: STATUS_COLOR[order.status] }}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <span className={styles.ebookOrderDate}>{formatDate(order.created_at)}</span>
              </div>

              <div className={styles.ebookGrid}>
                <div>
                  <p className={styles.ebookGridLabel}>이름</p>
                  <p className={`${styles.ebookGridValue} ${styles.ebookGridValueBold}`}>{order.name}</p>
                </div>
                <div>
                  <p className={styles.ebookGridLabel}>연락처</p>
                  <p className={styles.ebookGridValue}>{order.phone}</p>
                </div>
                <div>
                  <p className={styles.ebookGridLabel}>이메일</p>
                  <p className={styles.ebookGridValue}>{order.email}</p>
                </div>
                <div>
                  <p className={styles.ebookGridLabel}>금액</p>
                  <p className={`${styles.ebookGridValue} ${styles.ebookAmount}`}>
                    ₩{order.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {order.download_sent_at && (
                <p className={styles.ebookSentAt}>
                  발송: {formatDate(order.download_sent_at)}
                </p>
              )}

              <div className={styles.ebookActions}>
                {order.status === 'pending_payment' && (
                  <button
                    className={styles.refreshButton}
                    onClick={() => onConfirm(order.id, order.order_number)}
                    disabled={isProc}
                  >
                    입금 확인
                  </button>
                )}
                {order.status === 'payment_confirmed' && (
                  <button
                    className={styles.ebookSendBtn}
                    onClick={() => onSendLink(order.id, order.order_number, order.name)}
                    disabled={isProc}
                  >
                    다운로드 링크 발송
                  </button>
                )}
                {order.status === 'download_sent' && (
                  <button
                    className={styles.refreshButton}
                    onClick={() => onSendLink(order.id, order.order_number, order.name)}
                    disabled={isProc}
                  >
                    링크 재발송
                  </button>
                )}
                <button
                  className={`${styles.refreshButton} ${styles.bmDeleteBtn}`}
                  onClick={() => onDelete(order.id, order.order_number)}
                  disabled={isProc}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
