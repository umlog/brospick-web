import { showToast } from '../lib/toast';
import type { useOrders } from '../hooks/useOrders';
import type { useOrderActions } from '../hooks/useOrderActions';
import { STATUS_OPTIONS } from '../constants';
import { StatusFilter } from './StatusFilter';
import { OrderCard } from './OrderCard';
import styles from '../admin.module.css';

interface OrderListProps {
  ordersState: ReturnType<typeof useOrders>;
  actionsState: ReturnType<typeof useOrderActions>;
  notifyOnChange: boolean;
  onNotifyChange: (value: boolean) => void;
}

export function OrderList({ ordersState, actionsState, notifyOnChange, onNotifyChange }: OrderListProps) {
  const {
    orders,
    loading,
    processingOrders,
    filterStatus,
    filterMarketing,
    setFilterMarketing,
    searchQuery,
    setSearchQuery,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    handleStatusChange,
    handlePaymentReminder,
    handleDeleteOrder,
    handleFilterChange,
    handleRevokeMarketing,
    handleCancelRefundComplete,
  } = ordersState;

  const {
    expandedOrder,
    trackingModal,
    trackingInput,
    delayModal,
    delayWeeks,
    delayUnit,
    setTrackingInput,
    setTrackingModal,
    setDelayModal,
    setDelayWeeks,
    setDelayUnit,
    toggleExpanded,
    clearExpanded,
    handleShippingClick,
    handleDelayClick,
    handleTrackingSubmit,
    handleDelaySubmit,
  } = actionsState;

  const handleDelete = async (orderId: string, orderNumber: string) => {
    await handleDeleteOrder(orderId, orderNumber);
    clearExpanded();
  };

  const handleExportCSV = () => {
    const marketingOrders = orders.filter((o) => o.marketing_consent);
    if (marketingOrders.length === 0) {
      showToast('마케팅 수신 동의 고객이 없습니다.', 'info');
      return;
    }
    const header = '이름,전화번호,이메일,주문번호,주문일자';
    const rows = marketingOrders.map((o) =>
      [o.customer_name, o.customer_phone, o.customer_email ?? '', o.order_number, o.created_at.split('T')[0]].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `마케팅동의고객_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="주문번호, 고객명, 전화번호 검색..."
        />
        {searchQuery && (
          <button className={styles.searchClearBtn} onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

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

      <div className={styles.marketingFilter}>
        <span className={styles.marketingFilterLabel}>마케팅 동의</span>
        <button
          className={`${styles.marketingFilterBtn} ${filterMarketing === null ? styles.marketingFilterBtnActive : ''}`}
          onClick={() => setFilterMarketing(null)}
        >
          전체
        </button>
        <button
          className={`${styles.marketingFilterBtn} ${filterMarketing === true ? styles.marketingFilterBtnActive : ''}`}
          onClick={() => setFilterMarketing(true)}
        >
          동의
        </button>
        <button
          className={`${styles.marketingFilterBtn} ${filterMarketing === false ? styles.marketingFilterBtnActive : ''}`}
          onClick={() => setFilterMarketing(false)}
        >
          미동의
        </button>
        <button className={styles.csvExportBtn} onClick={handleExportCSV}>
          CSV 내보내기
        </button>
      </div>

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
              delayModal={delayModal}
              delayWeeks={delayWeeks}
              delayUnit={delayUnit}
              processing={processingOrders.has(order.id)}
              onToggleExpand={toggleExpanded}
              onStatusChange={handleStatusChange}
              onShippingClick={handleShippingClick}
              onTrackingSubmit={handleTrackingSubmit}
              onTrackingInputChange={setTrackingInput}
              onTrackingCancel={() => setTrackingModal(null)}
              onNotifyChange={onNotifyChange}
              onDelayClick={handleDelayClick}
              onDelayWeeksChange={setDelayWeeks}
              onDelayUnitChange={setDelayUnit}
              onDelaySubmit={handleDelaySubmit}
              onDelayCancel={() => setDelayModal(null)}
              onPaymentReminder={handlePaymentReminder}
              onDelete={handleDelete}
              onRevokeMarketing={handleRevokeMarketing}
              onCancelRefundComplete={handleCancelRefundComplete}
            />
          ))}
        </div>
      )}
    </>
  );
}
