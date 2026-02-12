import styles from '../admin.module.css';

interface StatusFilterProps {
  options: string[];
  activeFilter: string;
  onChange: (status: string) => void;
}

export function StatusFilter({ options, activeFilter, onChange }: StatusFilterProps) {
  return (
    <div className={styles.filters}>
      <button
        className={`${styles.filterButton} ${activeFilter === '' ? styles.filterActive : ''}`}
        onClick={() => onChange('')}
      >
        전체
      </button>
      {options.map((status) => (
        <button
          key={status}
          className={`${styles.filterButton} ${activeFilter === status ? styles.filterActive : ''}`}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
