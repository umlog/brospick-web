import styles from '../admin.module.css';

interface DangerZoneProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  processingLabel?: string;
}

export function DangerZone({ label, onClick, disabled, processingLabel }: DangerZoneProps) {
  return (
    <div className={styles.dangerZone}>
      <button className={styles.deleteButton} onClick={onClick} disabled={disabled}>
        {disabled && processingLabel ? processingLabel : label}
      </button>
    </div>
  );
}
