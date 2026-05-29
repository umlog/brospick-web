'use client';

import { useEffect, useState } from 'react';
import { showToast } from '../lib/toast';
import type { useOrders } from '../hooks/useOrders';
import type { useOrderActions } from '../hooks/useOrderActions';
import { STATUS_OPTIONS } from '../constants';
import { BULK_ELIGIBLE_STATUSES } from '../hooks/useOrders';
import { StatusFilter } from './StatusFilter';
import { OrderCard } from './OrderCard';
import { TrashOrderCard } from './TrashOrderCard';
import { exportLogenExcel } from '@/lib/logen/exportLogenExcel';
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
    trashMode,
    setTrashMode,
    trashedOrders,
    trashLoading,
    fetchTrashedOrders,
    handleRestoreOrder,
    handlePermanentDelete,
  } = ordersState;

  useEffect(() => {
    if (trashMode) fetchTrashedOrders();
  }, [trashMode, fetchTrashedOrders]);

  const {
    expandedOrder,
    trackingModal,
    trackingInput,
    carrierInput,
    delayModal,
    delayWeeks,
    delayUnit,
    setTrackingInput,
    setCarrierInput,
    setTrackingModal,
    setDelayModal,
    setDelayWeeks,
    setDelayUnit,
    toggleExpanded,
    clearExpanded,
    handleShippingClick,
    handleDelayClick,
    handleTrackingSubmit,
    handleTrackingCancel,
    handleDelaySubmit,
  } = actionsState;

  const [fareType, setFareType] = useState<'신용' | '선불'>('신용');

  const handleLogenExport = () => {
    const targetOrders = ordersState.selectedOrders.size > 0
      ? orders.filter((o) => ordersState.selectedOrders.has(o.id))
      : orders;
    if (targetOrders.length === 0) {
      showToast('내보낼 주문이 없습니다.', 'info');
      return;
    }
    exportLogenExcel(targetOrders, fareType);
    showToast(`${targetOrders.length}건을 로젠 엑셀로 내보냈습니다.`, 'success');
  };

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
      {/* 휴지통 토글 */}
      <div className={styles.trashToggleBar}>
        <button
          className={`${styles.trashToggleBtn} ${trashMode ? styles.trashToggleBtnActive : ''}`}
          onClick={() => setTrashMode(!trashMode)}
        >
          휴지통{trashedOrders.length > 0 && !trashMode ? ` (${trashedOrders.length})` : ''}
        </button>
        {trashMode && (
          <span className={styles.trashModeLabel}>
            휴지통 — 삭제된 주문 {trashedOrders.length}건
          </span>
        )}
      </div>

      {trashMode ? (
        /* 휴지통 뷰 */
        trashLoading ? (
          <p className={styles.loading}>로딩 중...</p>
        ) : trashedOrders.length === 0 ? (
          <p className={styles.empty}>휴지통이 비어있습니다.</p>
        ) : (
          <div className={styles.orderList}>
            {trashedOrders.map((order) => (
              <TrashOrderCard
                key={order.id}
                order={order}
                processing={processingOrders.has(order.id)}
                onRestore={handleRestoreOrder}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )
      ) : (
        /* 일반 주문 뷰 */
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
            <>
              {/* 전체선택 바 */}
              <div className={styles.selectAllBar}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    className={styles.orderCheckbox}
                    checked={orders.length > 0 && orders.every((o) => ordersState.selectedOrders.has(o.id))}
                    onChange={() => {
                      const allSelected = orders.every((o) => ordersState.selectedOrders.has(o.id));
                      allSelected ? ordersState.clearSelection() : ordersState.selectAllVisible();
                    }}
                  />
                  전체선택 ({orders.length}건)
                </label>
                {ordersState.selectedOrders.size > 0 && (
                  <button className={styles.selectionClearBtn} onClick={ordersState.clearSelection}>
                    선택해제
                  </button>
                )}
              </div>

              <div className={styles.orderList}>
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    expanded={expandedOrder === order.id}
                    selected={ordersState.selectedOrders.has(order.id)}
                    trackingModal={trackingModal}
                    trackingInput={trackingInput}
                    carrierInput={carrierInput}
                    notifyOnChange={notifyOnChange}
                    delayModal={delayModal}
                    delayWeeks={delayWeeks}
                    delayUnit={delayUnit}
                    processing={processingOrders.has(order.id)}
                    onToggleExpand={toggleExpanded}
                    onToggleSelect={ordersState.toggleSelectOrder}
                    onStatusChange={handleStatusChange}
                    onShippingClick={handleShippingClick}
                    onTrackingSubmit={handleTrackingSubmit}
                    onTrackingInputChange={setTrackingInput}
                    onCarrierChange={setCarrierInput}
                    onTrackingCancel={handleTrackingCancel}
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
            </>
          )}

          {/* 일괄 액션 바 */}
          {ordersState.selectedOrders.size > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkBarInfo}>{ordersState.selectedOrders.size}건 선택됨</span>
              <div className={styles.bulkActions}>
                {BULK_ELIGIBLE_STATUSES.map((status) => (
                  <button
                    key={status}
                    className={styles.bulkStatusBtn}
                    onClick={() => ordersState.handleBulkStatusChange(status)}
                  >
                    {status}
                  </button>
                ))}
                <select
                  value={fareType}
                  onChange={(e) => setFareType(e.target.value as '신용' | '선불')}
                  className={styles.bulkClearBtn}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="신용">신용</option>
                  <option value="선불">선불</option>
                </select>
                <button className={styles.logenExportBtn} onClick={handleLogenExport}>
                  로젠 엑셀 내보내기
                </button>
              </div>
              <button className={styles.bulkClearBtn} onClick={ordersState.clearSelection}>
                선택 해제
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
