'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, EbookOrder } from '../types';
import { OrderStatus } from '@/lib/domain/enums';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

const REVENUE_STATUSES = new Set<string>([
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
]);
const DELAY_REGEX = /^(\d+)(주|일) 뒤 발송$/;

interface VisitData {
  today: number;
  recent: { date: string; count: number }[];
}

interface Props {
  allOrders: Order[];
  ebookOrders: EbookOrder[];
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

export function Dashboard({ allOrders, ebookOrders }: Props) {
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
  const thisMonth = today.slice(0, 7);

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

  const revenueOrders = useMemo(
    () => allOrders.filter((o) => REVENUE_STATUSES.has(o.status) || DELAY_REGEX.test(o.status)),
    [allOrders]
  );

  const totalRevenue = useMemo(
    () => revenueOrders.reduce((sum, o) => sum + o.total_amount, 0),
    [revenueOrders]
  );

  const thisMonthRevenue = useMemo(
    () => revenueOrders
      .filter((o) => o.created_at.startsWith(thisMonth))
      .reduce((sum, o) => sum + o.total_amount, 0),
    [revenueOrders, thisMonth]
  );

  const cancelledCount = useMemo(
    () => allOrders.filter(
      (o) => o.status === OrderStatus.CANCEL_REQUESTED || o.status === OrderStatus.CANCELLED
    ).length,
    [allOrders]
  );

  const ebookStats = useMemo(() => {
    const total = ebookOrders.length;
    const pending = ebookOrders.filter((o) => o.status === 'pending_payment').length;
    const confirmed = ebookOrders.filter((o) => o.status === 'payment_confirmed').length;
    const sent = ebookOrders.filter((o) => o.status === 'download_sent').length;
    const revenue = ebookOrders
      .filter((o) => o.status !== 'pending_payment')
      .reduce((s, o) => s + o.amount, 0);
    return { total, pending, confirmed, sent, revenue };
  }, [ebookOrders]);

  const marketingStats = useMemo(() => {
    const total = allOrders.length;
    const consented = allOrders.filter((o) => o.marketing_consent).length;
    const rate = total > 0 ? ((consented / total) * 100).toFixed(1) : '0.0';
    return { total, consented, rate };
  }, [allOrders]);

  const handleRunRetention = async () => {
    const ok = await showConfirm(
      '개인정보 보존 정책을 지금 실행할까요?\n3년 이상 된 마케팅 동의 및 5년 이상 된 주문 PII가 처리됩니다.'
    );
    if (!ok) return;
    setRetentionLoading(true);
    setRetentionResult(null);
    try {
      const res = await fetch('/api/admin/data-retention', { method: 'POST' });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();
      setRetentionResult(data);
    } catch (err) {
      showToast(`실행 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
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
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{cancelledCount}</div>
            <div className={styles.statLabel}>취소 건수</div>
          </div>
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2 className={styles.dashboardSectionTitle}>주문 매출 현황</h2>
        <div className={styles.dashboardGrid}>
          <div className={`${styles.dashboardCard} ${styles.dashboardCardHighlight}`}>
            <div className={styles.statNumber}>₩{(totalRevenue / 10000).toFixed(0)}만</div>
            <div className={styles.statLabel}>누적 매출 ({revenueOrders.length}건)</div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>₩{(thisMonthRevenue / 10000).toFixed(0)}만</div>
            <div className={styles.statLabel}>이번 달 매출</div>
          </div>
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
        <h2 className={styles.dashboardSectionTitle}>전자책 현황</h2>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{ebookStats.pending}</div>
            <div className={styles.statLabel}>입금 대기</div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{ebookStats.confirmed}</div>
            <div className={styles.statLabel}>입금 확인</div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.statNumber}>{ebookStats.sent}</div>
            <div className={styles.statLabel}>발송 완료</div>
          </div>
          <div className={`${styles.dashboardCard} ${styles.dashboardCardHighlight}`}>
            <div className={styles.statNumber}>₩{ebookStats.revenue.toLocaleString()}</div>
            <div className={styles.statLabel}>총 매출 ({ebookStats.total}건)</div>
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
