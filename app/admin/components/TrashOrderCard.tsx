import type { Order } from '../types';
import { formatDate, getStatusColor } from '../utils';
import styles from '../admin.module.css';

interface TrashOrderCardProps {
  order: Order;
  processing: boolean;
  onRestore: (orderId: string, orderNumber: string) => void;
  onPermanentDelete: (orderId: string, orderNumber: string) => void;
}

export function TrashOrderCard({ order, processing, onRestore, onPermanentDelete }: TrashOrderCardProps) {
  const deletedAt = order.deleted_at ? formatDate(order.deleted_at) : '-';

  return (
    <div className={styles.trashCard}>
      <div className={styles.trashCardHeader}>
        <div className={styles.orderMeta}>
          <span className={styles.orderNumber}>{order.order_number}</span>
          <span className={styles.orderDate}>주문일: {formatDate(order.created_at)}</span>
          <span className={styles.trashDeletedAt}>삭제일: {deletedAt}</span>
        </div>
        <div className={styles.orderQuick}>
          <span className={styles.orderCustomer}>{order.customer_name}</span>
          <span className={styles.orderAmount}>₩{order.total_amount.toLocaleString()}</span>
          <span className={`${styles.statusBadge} ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className={styles.trashCardItems}>
        {order.order_items.map((item) => (
          <span key={item.id} className={styles.trashItemChip}>
            {item.product_name} {item.size} ×{item.quantity}
          </span>
        ))}
      </div>

      <div className={styles.trashCardActions}>
        <button
          className={styles.trashRestoreBtn}
          onClick={() => onRestore(order.id, order.order_number)}
          disabled={processing}
        >
          복구
        </button>
        <button
          className={styles.trashPermanentDeleteBtn}
          onClick={() => onPermanentDelete(order.id, order.order_number)}
          disabled={processing}
        >
          영구 삭제
        </button>
      </div>
    </div>
  );
}
