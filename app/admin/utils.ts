import styles from './admin.module.css';

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
    case '입금대기': return styles.statusPending;
    case '입금확인': return styles.statusConfirmed;
    case '배송준비': return styles.statusPreparing;
    case '배송중': return styles.statusShipping;
    case '배송완료': return styles.statusDelivered;
    default: return '';
  }
}

export function getReturnStatusColor(status: string): string {
  switch (status) {
    case '접수완료': return styles.returnStatusReceived;
    case '승인': return styles.returnStatusApproved;
    case '수거중': return styles.returnStatusCollecting;
    case '수거완료': return styles.returnStatusCollected;
    case '처리완료': return styles.returnStatusComplete;
    case '거절': return styles.returnStatusRejected;
    default: return '';
  }
}
