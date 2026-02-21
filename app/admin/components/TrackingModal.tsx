import styles from '../admin.module.css';
import { CARRIERS, TRACKING } from '@/lib/constants';

interface TrackingModalProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  showCarrierSelect?: boolean;
}

export function TrackingModal({
  title,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  showCarrierSelect,
}: TrackingModalProps) {
  return (
    <div className={styles.trackingModal}>
      <h4>{title}</h4>
      {showCarrierSelect && (
        <select className={styles.carrierSelect} defaultValue={TRACKING.defaultCarrier}>
          {CARRIERS.map((carrier) => (
            <option key={carrier} value={carrier}>{carrier}</option>
          ))}
        </select>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="운송장번호를 입력하세요"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
      />
      <div className={styles.trackingModalButtons}>
        <button className={styles.trackingCancelButton} onClick={onCancel}>
          취소
        </button>
        <button className={styles.trackingConfirmButton} onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
