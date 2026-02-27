import styles from './admin.module.css';
import { OrderStatus, ReturnStatus } from '@/lib/domain/enums';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT: return styles.statusPending;
    case OrderStatus.PAYMENT_CONFIRMED: return styles.statusConfirmed;
    case '배송준비': return styles.statusPreparing;
    case OrderStatus.SHIPPING: return styles.statusShipping;
    case OrderStatus.DELIVERED: return styles.statusDelivered;
    default:
      if (/^\d+주 뒤 발송$/.test(status)) return styles.statusDelay;
      return '';
  }
}

export function getReturnStatusColor(status: string): string {
  switch (status) {
    case ReturnStatus.RECEIVED: return styles.returnStatusReceived;
    case ReturnStatus.APPROVED: return styles.returnStatusApproved;
    case ReturnStatus.COLLECTING: return styles.returnStatusCollecting;
    case ReturnStatus.COLLECTED: return styles.returnStatusCollected;
    case ReturnStatus.COMPLETED: return styles.returnStatusComplete;
    case ReturnStatus.REJECTED: return styles.returnStatusRejected;
    default: return '';
  }
}
