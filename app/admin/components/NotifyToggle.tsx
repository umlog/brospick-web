import styles from '../admin.module.css';

interface NotifyToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  noEmail?: boolean;
}

export function NotifyToggle({ checked, onChange, noEmail }: NotifyToggleProps) {
  return (
    <label className={styles.notifyToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>고객에게 알림 보내기</span>
      {noEmail && <span className={styles.noEmail}>(이메일 없음)</span>}
    </label>
  );
}
