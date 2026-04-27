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
      <button
        className={`${styles.adminTab} ${activeTab === 'products' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('products')}
      >
        상품 관리
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'dashboard' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        대시보드
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'blog' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('blog')}
      >
        블로그 관리
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'marketing' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('marketing')}
      >
        마케팅 이메일
      </button>
    </div>
  );
}
