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
      <button
        className={`${styles.adminTab} ${activeTab === 'ebook' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('ebook')}
      >
        전자책 주문
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'reviews' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('reviews')}
      >
        리뷰 관리
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'popups' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('popups')}
      >
        팝업
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'banners' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('banners')}
      >
        배너
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'faqs' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('faqs')}
      >
        FAQ
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'coupons' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('coupons')}
      >
        쿠폰
      </button>
      <button
        className={`${styles.adminTab} ${activeTab === 'finance' ? styles.adminTabActive : ''}`}
        onClick={() => onTabChange('finance')}
      >
        재무
      </button>
    </div>
  );
}
