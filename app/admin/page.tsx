'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTab } from './types';
import { useOrders } from './hooks/useOrders';
import { useOrderActions } from './hooks/useOrderActions';
import { useReturns } from './hooks/useReturns';
import { useProductSizes } from './hooks/useProductSizes';
import { useProductCatalog } from './hooks/useProductCatalog';
import { useBlogPosts } from './hooks/useBlogPosts';
import { useEbookOrders } from './hooks/useEbookOrders';
import { AdminTabs } from './components/AdminTabs';
import { OrderList } from './components/OrderList';
import { ReturnList } from './components/ReturnList';
import { ProductManager } from './components/ProductManager';
import { Dashboard } from './components/Dashboard';
import { BlogManager } from './components/BlogManager';
import { MarketingEmailManager } from './components/MarketingEmailManager';
import { EbookOrderList } from './components/EbookOrderList';
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
};

export default function AdminPage() {
  const router = useRouter();
  const [notifyOnChange, setNotifyOnChange] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const ordersState = useOrders(notifyOnChange);
  const actionsState = useOrderActions(ordersState.handleStatusChange);
  const returnsState = useReturns(notifyOnChange);
  const productSizesState = useProductSizes();
  const productCatalogState = useProductCatalog();
  const blogState = useBlogPosts();
  const ebookState = useEbookOrders();

  useEffect(() => {
    ordersState.fetchOrders();
    ebookState.fetchOrders();
  }, []);

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
  };

  const handleRefresh = () => {
    if (activeTab === 'orders' || activeTab === 'dashboard') {
      ordersState.fetchOrders();
    } else if (activeTab === 'returns') {
      returnsState.fetchReturns(returnsState.filterStatus || undefined);
    } else if (activeTab === 'blog') {
      blogState.fetchPosts();
    } else if (activeTab === 'ebook') {
      ebookState.fetchOrders();
    } else {
      productSizesState.fetchSizes();
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
            <button onClick={handleRefresh} className={styles.refreshButton}>
              새로고침
            </button>
            <button onClick={handleLogout} className={styles.refreshButton}>
              로그아웃
            </button>
          </div>
        </div>

        <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} />

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
      </div>
      <VisitCounter />
      <Toasts />
      <ConfirmModal />
    </main>
  );
}
