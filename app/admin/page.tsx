'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTab } from './types';
import { OrderStatus, ReturnStatus } from '@/lib/domain/enums';
import { useOrders } from './hooks/useOrders';
import { useOrderActions } from './hooks/useOrderActions';
import { useReturns } from './hooks/useReturns';
import { useProductSizes } from './hooks/useProductSizes';
import { useProductCatalog } from './hooks/useProductCatalog';
import { useBlogPosts } from './hooks/useBlogPosts';
import { useEbookOrders } from './hooks/useEbookOrders';
import { usePopups } from './hooks/usePopups';
import { useBanners } from './hooks/useBanners';
import { useFaqs } from './hooks/useFaqs';
import { useCoupons } from './hooks/useCoupons';
import { AdminTabs } from './components/AdminTabs';
import { OrderList } from './components/OrderList';
import { ReturnList } from './components/ReturnList';
import { ProductManager } from './components/ProductManager';
import { Dashboard } from './components/Dashboard';
import { BlogManager } from './components/BlogManager';
import { MarketingEmailManager } from './components/MarketingEmailManager';
import { EbookOrderList } from './components/EbookOrderList';
import { ReviewManager } from './components/ReviewManager';
import { PopupManager } from './components/PopupManager';
import { BannerManager } from './components/BannerManager';
import { FaqManager } from './components/FaqManager';
import { CouponManager } from './components/CouponManager';
import { FinanceManager } from './components/FinanceManager';
import { VisitCounter } from './components/VisitCounter';
import { Toasts } from './components/Toasts';
import { ConfirmModal } from './components/ConfirmModal';
import styles from './admin.module.css';

const TAB_TITLES: Record<AdminTab, string> = {
  orders: '주문 관리',
  returns: '교환/반품 관리',
  products: '상품 관리',
  dashboard: '대시보드',
  blog: '블로그 관리',
  marketing: '마케팅 이메일',
  ebook: '전자책 주문',
  reviews: '리뷰 관리',
  popups: '팝업 관리',
  banners: '배너 관리',
  faqs: 'FAQ 관리',
  coupons: '쿠폰 관리',
  finance: '재무 관리',
};

const TAB_STORAGE_KEY = 'admin_active_tab';
const VALID_TABS = new Set<AdminTab>(Object.keys(TAB_TITLES) as AdminTab[]);

export default function AdminPage() {
  const router = useRouter();
  const [notifyOnChange, setNotifyOnChange] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [refreshing, setRefreshing] = useState(false);

  const ordersState = useOrders(notifyOnChange);
  const actionsState = useOrderActions(ordersState.handleStatusChange);
  const returnsState = useReturns(notifyOnChange);
  const productSizesState = useProductSizes();
  const productCatalogState = useProductCatalog();
  const blogState = useBlogPosts();
  const ebookState = useEbookOrders();
  const popupsState = usePopups();
  const bannersState = useBanners();
  const faqsState = useFaqs();
  const couponsState = useCoupons();

  useEffect(() => {
    ordersState.fetchOrders();
    ebookState.fetchOrders();
    // 반품 뱃지 카운트를 첫 화면부터 보여주기 위해 마운트 시 함께 로드
    returnsState.fetchReturns();

    // 마지막으로 보던 탭 복원
    const saved = localStorage.getItem(TAB_STORAGE_KEY) as AdminTab | null;
    if (saved && saved !== 'orders' && VALID_TABS.has(saved)) {
      handleTabChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 활성 탭 저장
  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // 탭별 "처리 필요" 카운트
  const tabCounts = useMemo<Partial<Record<AdminTab, number>>>(() => {
    const ordersPending = ordersState.allOrders.filter(
      (o) => o.status === OrderStatus.PAYMENT_CONFIRMED || o.status === OrderStatus.CANCEL_REQUESTED,
    ).length;
    const returnsPending = returnsState.returnRequests.filter(
      (r) => r.status !== ReturnStatus.COMPLETED && r.status !== ReturnStatus.REJECTED,
    ).length;
    return { orders: ordersPending, returns: returnsPending };
  }, [ordersState.allOrders, returnsState.returnRequests]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'returns' && !returnsState.hasLoaded) {
      returnsState.fetchReturns();
    }
    if (tab === 'products' && !productSizesState.hasLoaded) {
      productSizesState.fetchSizes();
      productCatalogState.fetchProducts();
    }
    if (tab === 'blog' && !blogState.hasLoaded) {
      blogState.fetchPosts();
    }
    if (tab === 'ebook' && !ebookState.hasLoaded) {
      ebookState.fetchOrders();
    }
    if (tab === 'popups' && !popupsState.hasLoaded) {
      popupsState.fetchPopups();
    }
    if (tab === 'banners' && !bannersState.hasLoaded) {
      bannersState.fetchBanners();
    }
    if (tab === 'faqs' && !faqsState.hasLoaded) {
      faqsState.fetchFaqs();
    }
    if (tab === 'coupons' && !couponsState.hasLoaded) {
      couponsState.fetchCoupons();
    }
    if (tab === 'finance' && !productCatalogState.hasLoaded) {
      productCatalogState.fetchProducts();
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (activeTab === 'orders' || activeTab === 'dashboard') {
        await ordersState.fetchOrders();
      } else if (activeTab === 'returns') {
        await returnsState.fetchReturns(returnsState.filterStatus || undefined);
      } else if (activeTab === 'blog') {
        await blogState.fetchPosts();
      } else if (activeTab === 'ebook') {
        await ebookState.fetchOrders();
      } else {
        await productSizesState.fetchSizes();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{TAB_TITLES[activeTab]}</h1>
          <div className={styles.headerButtons}>
            <button onClick={handleRefresh} className={styles.refreshButton} disabled={refreshing}>
              {refreshing && <span className={styles.refreshSpinner} aria-hidden="true" />}
              {refreshing ? '새로고침 중' : '새로고침'}
            </button>
            <button onClick={handleLogout} className={styles.refreshButton}>
              로그아웃
            </button>
          </div>
        </div>

        <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} counts={tabCounts} />

        {activeTab === 'orders' && (
          <OrderList
            ordersState={ordersState}
            actionsState={actionsState}
            notifyOnChange={notifyOnChange}
            onNotifyChange={setNotifyOnChange}
          />
        )}
        {activeTab === 'returns' && (
          <ReturnList
            returnsState={returnsState}
            notifyOnChange={notifyOnChange}
            onNotifyChange={setNotifyOnChange}
          />
        )}
        {activeTab === 'products' && (
          <ProductManager catalogState={productCatalogState} sizesState={productSizesState} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard allOrders={ordersState.allOrders} ebookOrders={ebookState.orders} />
        )}
        {activeTab === 'blog' && (
          <BlogManager state={blogState} />
        )}
        {activeTab === 'marketing' && (
          <MarketingEmailManager />
        )}
        {activeTab === 'ebook' && (
          <EbookOrderList
            orders={ebookState.orders}
            loading={ebookState.loading}
            processing={ebookState.processing}
            onConfirm={ebookState.handleConfirm}
            onSendLink={ebookState.handleSendLink}
            onDelete={ebookState.handleDelete}
          />
        )}
        {activeTab === 'reviews' && <ReviewManager />}
        {activeTab === 'popups' && <PopupManager state={popupsState} />}
        {activeTab === 'banners' && <BannerManager state={bannersState} />}
        {activeTab === 'faqs' && <FaqManager state={faqsState} />}
        {activeTab === 'coupons' && <CouponManager state={couponsState} />}
        {activeTab === 'finance' && <FinanceManager products={productCatalogState.products} />}
      </div>
      <VisitCounter />
      <Toasts />
      <ConfirmModal />
    </main>
  );
}
