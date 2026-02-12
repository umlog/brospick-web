import styles from '../admin.module.css';

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
        <select className={styles.carrierSelect} defaultValue="CJ대한통운">
          <option value="CJ대한통운">CJ대한통운</option>
          <option value="한진택배">한진택배</option>
          <option value="롯데택배">롯데택배</option>
          <option value="로젠택배">로젠택배</option>
          <option value="우체국택배">우체국택배</option>
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
