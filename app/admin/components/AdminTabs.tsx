import type { AdminTab } from '../types';
import styles from '../admin.module.css';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className={styles.adminTabs}>
      <button
        className={`${styles.adminTab} ${activeTab === 'orders' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('orders')}
      >
        주문 관리
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'returns' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('returns')}
      >
        교환/반품
      </button>
    </div>
  );
}
