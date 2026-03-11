'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '@/lib/domain/enums';
import styles from '../admin.module.css';

interface VisitData {
  today: number;
  recent: { date: string; count: number }[];
}

interface Props {
  allOrders: Order[];
}

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PENDING_PAYMENT]: '입금 대기',
  [OrderStatus.PAYMENT_CONFIRMED]: '입금 확인',
  [OrderStatus.SHIPPING]: '배송 중',
  [OrderStatus.DELIVERED]: '배송 완료',
};

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
];

interface RetentionResult {
  marketing_cleared: number;
  pii_anonymized: number;
  ran_at: string;
}

export function Dashboard({ allOrders }: Props) {
  const [visitData, setVisitData] = useState<VisitData | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionResult, setRetentionResult] = useState<RetentionResult | null>(null);

  useEffect(() => {
    fetch('/api/visits')
      .then((r) => r.json())
      .then((d) => setVisitData(d))
      .catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const orderCountByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of STATUS_ORDER) counts[status] = 0;
    for (const order of allOrders) {
      if (counts[order.status] !== undefined) counts[order.status]++;
    }
    return counts;
  }, [allOrders]);

  const todayOrders = useMemo(
    () => allOrders.filter((o) => o.created_at.startsWith(today)),
    [allOrders, today]
  );

  const conversionRate = visitData && visitData.today > 0
    ? ((todayOrders.length / visitData.today) * 100).toFixed(1)
    : '0.0';

  const maxVisits = useMemo(
    () => Math.max(...(visitData?.recent.map((r) => r.count) ?? [1]), 1),
    [visitData]
  );

  const marketingStats = useMemo(() => {
    const total = allOrders.length;
    const consented = allOrders.filter((o) => o.marketing_consent).length;
    const rate = total > 0 ? ((consented / total) * 100).toFixed(1) : '0.0';
    return { total, consented, rate };
  }, [allOrders]);

  const handleRunRetention = async () => {
    if (!confirm('개인정보 보존 정책을 지금 실행할까요?\n3년 이상 된 마케팅 동의 및 5년 이상 된 주문 PII가 처리됩니다.')) return;
    setRetentionLoading(true);
    setRetentionResult(null);
    try {
      const res = await fetch('/api/admin/data-retention', { method: 'POST' });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();
      setRetentionResult(data);
    } catch (err) {
      alert(`실행 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setRetentionLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>주문 현황</h2>
        <div className={styles.dashboardGrid}>
          {STATUS_ORDER.map((status) => (
            <div key={status} className={styles.dashboardCard}>
              <div className={styles.statNumber}>{orderCountByStatus[status]}</div>
              <div className={styles.statLabel}>{STATUS_LABELS[status]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>오늘 현황</h2>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{visitData?.today.toLocaleString() ?? '-'}</div>
            <div className={styles.statLabel}>방문자 수</div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{todayOrders.length}</div>
            <div className={styles.statLabel}>주문 수</div>
          </div>
          <div className={`${styles.dashboardCard} ${styles.dashboardCardHighlight}`}>
            <div className={styles.statNumber}>{conversionRate}%</div>
            <div className={styles.statLabel}>구매 전환율</div>
          </div>
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>마케팅 수신 동의 현황</h2>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{marketingStats.consented.toLocaleString()}</div>
            <div className={styles.statLabel}>동의 고객</div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{(marketingStats.total - marketingStats.consented).toLocaleString()}</div>
            <div className={styles.statLabel}>미동의 고객</div>
          </div>
          <div className={`${styles.dashboardCard} ${styles.dashboardCardHighlight}`}>
            <div className={styles.statNumber}>{marketingStats.rate}%</div>
            <div className={styles.statLabel}>동의율</div>
          </div>
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>개인정보 보존 정책</h2>
        <div className={styles.retentionInfo}>
          <p className={styles.retentionDesc}>
            마케팅 동의는 동의 시점으로부터 <strong>3년</strong> 후 자동 초기화되며,
            주문 개인정보(이름·전화·이메일·주소)는 <strong>5년</strong> 후 익명화됩니다.
            Netlify Scheduled Function이 매일 새벽 2시(KST)에 자동 실행됩니다.
          </p>
          <button
            className={styles.retentionRunBtn}
            onClick={handleRunRetention}
            disabled={retentionLoading}
          >
            {retentionLoading ? '실행 중...' : '지금 실행'}
          </button>
          {retentionResult && (
            <div className={styles.retentionResult}>
              <span>마케팅 동의 초기화: <strong>{retentionResult.marketing_cleared}건</strong></span>
              <span>PII 익명화: <strong>{retentionResult.pii_anonymized}건</strong></span>
              <span className={styles.retentionTime}>{new Date(retentionResult.ran_at).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>최근 7일 방문 추이</h2>
        {!visitData || visitData.recent.length === 0 ? (
          <p className={styles.empty}>데이터가 없습니다.</p>
        ) : (
          <div className={styles.barChart}>
            {visitData.recent.map((row) => (
              <div key={row.date} className={styles.barRow}>
                <span className={styles.barLabel}>{row.date.slice(5)}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ width: `${(row.count / maxVisits) * 100}%` }}
                  />
                </div>
                <span className={styles.barCount}>{row.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
