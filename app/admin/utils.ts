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
    case OrderStatus.KAKAO_PAY_PENDING: return styles.statusKakaoPending;
    case OrderStatus.PAYMENT_CONFIRMED: return styles.statusConfirmed;
    case OrderStatus.PREPARING: return styles.statusPreparing;
    case OrderStatus.SHIPPING: return styles.statusShipping;
    case OrderStatus.DELIVERED: return styles.statusDelivered;
    default:
      if (/^(\d+)(주|일) 뒤 발송$/.test(status)) return styles.statusDelay;
      return '';
  }
}

/** 로드된 데이터를 CSV로 다운로드 (클라이언트 생성 — 서버 호출 없음). 엑셀 호환 BOM 포함 */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const s = String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
