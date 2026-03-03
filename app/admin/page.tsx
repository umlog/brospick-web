'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTab } from './types';
import { useOrders } from './hooks/useOrders';
import { useReturns } from './hooks/useReturns';
import { useProductSizes } from './hooks/useProductSizes';
import { AdminTabs } from './components/AdminTabs';
import { OrderList } from './components/OrderList';
import { ReturnList } from './components/ReturnList';
import { ProductSizeManager } from './components/ProductSizeManager';
import { Dashboard } from './components/Dashboard';
import { VisitCounter } from './components/VisitCounter';
import styles from './admin.module.css';

const TAB_TITLES: Record<AdminTab, string> = {
  orders: '주문 관리',
  returns: '교환/반품 관리',
  products: '상품 관리',
  dashboard: '대시보드',
};

export default function AdminPage() {
  const router = useRouter();
  const ordersState = useOrders();
  const returnsState = useReturns(ordersState.notifyOnChange);
  const productSizesState = useProductSizes();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  useEffect(() => {
    ordersState.fetchOrders();
  }, []);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'returns' && returnsState.returnRequests.length === 0) {
      returnsState.fetchReturns();
    }
    if (tab === 'products') {
      productSizesState.fetchSizes();
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'orders' || activeTab === 'dashboard') {
      ordersState.fetchOrders();
    } else if (activeTab === 'returns') {
      returnsState.fetchReturns(returnsState.filterStatus || undefined);
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
          <div style={{ display: 'flex', gap: '8px' }}>
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
          <OrderList ordersState={ordersState} />
        )}
        {activeTab === 'returns' && (
          <ReturnList
            returnsState={returnsState}
            notifyOnChange={ordersState.notifyOnChange}
            onNotifyChange={ordersState.setNotifyOnChange}
          />
        )}
        {activeTab === 'products' && (
          <ProductSizeManager state={productSizesState} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard allOrders={ordersState.allOrders} />
        )}
      </div>
      <VisitCounter />
    </main>
  );
}
