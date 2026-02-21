'use client';

import { useState } from 'react';
import type { AdminTab } from './types';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useOrders } from './hooks/useOrders';
import { useReturns } from './hooks/useReturns';
import { useProductSizes } from './hooks/useProductSizes';
import { LoginForm } from './components/LoginForm';
import { AdminTabs } from './components/AdminTabs';
import { OrderList } from './components/OrderList';
import { ReturnList } from './components/ReturnList';
import { ProductSizeManager } from './components/ProductSizeManager';
import { VisitCounter } from './components/VisitCounter';
import styles from './admin.module.css';

export default function AdminPage() {
  const auth = useAdminAuth();
  const ordersState = useOrders(auth.password, auth.handleAuthFailure);
  const returnsState = useReturns(auth.password, ordersState.notifyOnChange);
  const productSizesState = useProductSizes(auth.password);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    ordersState.fetchOrders(auth.password).then(() => auth.handleLoginSuccess());
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'returns' && returnsState.returnRequests.length === 0) {
      returnsState.fetchReturns(auth.password);
    }
    if (tab === 'products') {
      productSizesState.fetchSizes();
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'orders') {
      ordersState.fetchOrders(auth.password, ordersState.filterStatus || undefined);
    } else if (activeTab === 'returns') {
      returnsState.fetchReturns(auth.password, returnsState.filterStatus || undefined);
    } else {
      productSizesState.fetchSizes();
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <LoginForm
        password={auth.password}
        onPasswordChange={auth.setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{activeTab === 'orders' ? '주문 관리' : activeTab === 'returns' ? '교환/반품 관리' : '상품 관리'}</h1>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            새로고침
          </button>
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
      </div>
      <VisitCounter password={auth.password} />
    </main>
  );
}
