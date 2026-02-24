import type { useOrders } from '../hooks/useOrders';
import { STATUS_OPTIONS } from '../constants';
import { StatusFilter } from './StatusFilter';
import { OrderCard } from './OrderCard';
import styles from '../admin.module.css';

type OrdersState = ReturnType<typeof useOrders>;

interface OrderListProps {
  ordersState: OrdersState;
}

export function OrderList({ ordersState }: OrderListProps) {
  const {
    orders,
    loading,
    filterStatus,
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
    handleStatusChange,
    handleShippingClick,
    handleTrackingSubmit,
    handlePaymentReminder,
    handleDeleteOrder,
    handleFilterChange,
    toggleExpanded,
  } = ordersState;

  return (
    <>
      <div className={styles.dateFilter}>
        <input
          type="date"
          className={styles.dateInput}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <span className={styles.dateSeparator}>~</span>
        <input
          type="date"
          className={styles.dateInput}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        {(dateFrom || dateTo) && (
          <button
            className={styles.dateResetBtn}
            onClick={() => { setDateFrom(''); setDateTo(''); }}
          >
            초기화
          </button>
        )}
      </div>

      <StatusFilter
        options={STATUS_OPTIONS}
        activeFilter={filterStatus}
        onChange={handleFilterChange}
      />

      {loading ? (
        <p className={styles.loading}>로딩 중...</p>
      ) : orders.length === 0 ? (
        <p className={styles.empty}>주문이 없습니다.</p>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedOrder === order.id}
              trackingModal={trackingModal}
              trackingInput={trackingInput}
              notifyOnChange={notifyOnChange}
              onToggleExpand={toggleExpanded}
              onStatusChange={handleStatusChange}
              onShippingClick={handleShippingClick}
              onTrackingSubmit={handleTrackingSubmit}
              onTrackingInputChange={setTrackingInput}
              onTrackingCancel={() => setTrackingModal(null)}
              onNotifyChange={setNotifyOnChange}
              onPaymentReminder={handlePaymentReminder}
              onDelete={handleDeleteOrder}
            />
          ))}
        </div>
      )}
    </>
  );
}
