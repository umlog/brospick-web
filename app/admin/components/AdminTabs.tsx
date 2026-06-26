import type { AdminTab } from '../types';
import styles from '../admin.module.css';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  /** 탭별 "처리 필요" 카운트. 0이거나 없으면 뱃지를 숨긴다. */
  counts?: Partial<Record<AdminTab, number>>;
}

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'orders', label: '주문 관리' },
  { key: 'returns', label: '교환/반품' },
  { key: 'products', label: '상품 관리' },
  { key: 'dashboard', label: '대시보드' },
  { key: 'blog', label: '블로그 관리' },
  { key: 'marketing', label: '마케팅 이메일' },
  { key: 'ebook', label: '전자책 주문' },
  { key: 'reviews', label: '리뷰 관리' },
  { key: 'popups', label: '팝업' },
  { key: 'banners', label: '배너' },
  { key: 'faqs', label: 'FAQ' },
  { key: 'coupons', label: '쿠폰' },
  { key: 'finance', label: '재무' },
];

export function AdminTabs({ activeTab, onTabChange, counts }: AdminTabsProps) {
  return (
    <div className={styles.adminTabs}>
      {TABS.map(({ key, label }) => {
        const count = counts?.[key] ?? 0;
        return (
          <button
            key={key}
            className={`${styles.adminTab} ${activeTab === key ? styles.adminTabActive : ''}`}
            onClick={() => onTabChange(key)}
          >
            {label}
            {count > 0 && <span className={styles.tabBadge}>{count > 99 ? '99+' : count}</span>}
          </button>
        );
      })}
    </div>
  );
}
