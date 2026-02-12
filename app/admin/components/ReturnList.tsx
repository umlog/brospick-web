import type { useReturns } from '../hooks/useReturns';
import { RETURN_STATUS_OPTIONS } from '../constants';
import { StatusFilter } from './StatusFilter';
import { ReturnCard } from './ReturnCard';
import styles from '../admin.module.css';

type ReturnsState = ReturnType<typeof useReturns>;

interface ReturnListProps {
  returnsState: ReturnsState;
  notifyOnChange: boolean;
  onNotifyChange: (value: boolean) => void;
}

export function ReturnList({ returnsState, notifyOnChange, onNotifyChange }: ReturnListProps) {
  const {
    returnRequests,
    loading,
    filterStatus,
    expandedReturn,
    trackingModal,
    trackingInput,
    rejectModal,
    rejectReason,
    setTrackingModal,
    setTrackingInput,
    setRejectModal,
    setRejectReason,
    handleStatusChange,
    handleDelete,
    handleFilterChange,
    handleRefundComplete,
    toggleExpanded,
  } = returnsState;

  return (
    <>
      <StatusFilter
        options={RETURN_STATUS_OPTIONS}
        activeFilter={filterStatus}
        onChange={handleFilterChange}
      />

      {loading ? (
        <p className={styles.loading}>로딩 중...</p>
      ) : returnRequests.length === 0 ? (
        <p className={styles.empty}>교환/반품 요청이 없습니다.</p>
      ) : (
        <div className={styles.orderList}>
          {returnRequests.map((req) => (
            <ReturnCard
              key={req.id}
              request={req}
              expanded={expandedReturn === req.id}
              trackingModal={trackingModal}
              trackingInput={trackingInput}
              rejectModal={rejectModal}
              rejectReason={rejectReason}
              notifyOnChange={notifyOnChange}
              onToggleExpand={toggleExpanded}
              onStatusChange={handleStatusChange}
              onRefundComplete={handleRefundComplete}
              onDelete={handleDelete}
              onTrackingModalOpen={(id) => { setTrackingModal(id); setTrackingInput(''); }}
              onTrackingInputChange={setTrackingInput}
              onTrackingCancel={() => setTrackingModal(null)}
              onRejectModalOpen={(id) => { setRejectModal(id); setRejectReason(''); }}
              onRejectReasonChange={setRejectReason}
              onRejectCancel={() => setRejectModal(null)}
              onNotifyChange={onNotifyChange}
            />
          ))}
        </div>
      )}
    </>
  );
}
