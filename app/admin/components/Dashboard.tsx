'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order } from '../types';
import styles from '../admin.module.css';

interface VisitData {
  today: number;
  recent: { date: string; count: number }[];
}

interface Props {
  password: string;
  allOrders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  '입금대기': '입금 대기',
  '입금확인': '입금 확인',
  '배송중': '배송 중',
  '배송완료': '배송 완료',
};

const STATUS_ORDER = ['입금대기', '입금확인', '배송중', '배송완료'];

export function Dashboard({ password, allOrders }: Props) {
  const [visitData, setVisitData] = useState<VisitData | null>(null);

  useEffect(() => {
    fetch('/api/visits', {
      headers: { 'x-admin-password': password },
    })
      .then((r) => r.json())
      .then((d) => setVisitData(d))
      .catch(() => {});
  }, [password]);

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
