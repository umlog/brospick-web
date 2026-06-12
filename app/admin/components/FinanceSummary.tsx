'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface SummaryData {
  period: { from: string; to: string };
  revenue: { gross: number; refunds: number; net: number; ebook: number; total_net: number; order_count: number };
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  expenses_by_category: Record<string, number>;
  total_expenses: number;
  operating_income: number;
  vat: { sales_tax_base: number; output_vat: number; input_vat: number; vat_payable: number; vat_deductible_expenses: number };
}

function fmt(n: number) { return '₩' + n.toLocaleString(); }

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--size-sm)' };
const rowLast: React.CSSProperties = { ...row, borderBottom: 'none' };
const lbl: React.CSSProperties = { color: 'var(--color-text-secondary)' };
const val: React.CSSProperties = { fontWeight: 600, color: 'var(--color-text-primary)' };
const inputStyle: React.CSSProperties = { padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)' };

export function FinanceSummary() {
  const thisYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${thisYear}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSummary(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSummary() {
    setLoading(true);
    const res = await fetch(`/api/admin/finance/summary?from=${from}&to=${to}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>시작일</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...lbl, display: 'block', marginBottom: 4 }}>종료일</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={fetchSummary} className={styles.refreshButton}>조회</button>
        </div>
      </section>

      {loading && <p className={styles.loading}>불러오는 중...</p>}

      {data && (
        <>
          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>매출</h2>
            <div style={row}><span style={lbl}>총 매출 (주문 {data.revenue.order_count}건)</span><span style={val}>{fmt(data.revenue.gross)}</span></div>
            <div style={row}><span style={lbl}>환불 차감</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.revenue.refunds)}</span></div>
            <div style={row}><span style={lbl}>순 매출 (주문)</span><span style={val}>{fmt(data.revenue.net)}</span></div>
            <div style={row}><span style={lbl}>전자책 매출</span><span style={val}>{fmt(data.revenue.ebook)}</span></div>
            <div style={rowLast}><span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>총 순매출</span><span style={{ fontWeight: 700, fontSize: '1.1em', color: 'var(--color-accent)' }}>{fmt(data.revenue.total_net)}</span></div>
          </section>

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>손익 계산</h2>
            <div style={row}><span style={lbl}>순매출</span><span style={val}>{fmt(data.revenue.total_net)}</span></div>
            <div style={row}><span style={lbl}>매출원가 (COGS)</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.cogs)}</span></div>
            <div style={row}><span style={lbl}>매출총이익</span><span style={val}>{fmt(data.gross_profit)} ({data.gross_margin_pct}%)</span></div>
            <div style={row}><span style={lbl}>총 지출</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.total_expenses)}</span></div>
            <div style={rowLast}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>영업이익</span>
              <span style={{ fontWeight: 700, fontSize: '1.1em', color: data.operating_income >= 0 ? '#4ade80' : '#f87171' }}>{fmt(data.operating_income)}</span>
            </div>
          </section>

          {Object.keys(data.expenses_by_category).length > 0 && (
            <section className={styles.dashboardSection}>
              <h2 className={styles.dashboardSectionTitle}>지출 항목별</h2>
              {Object.entries(data.expenses_by_category).map(([cat, amt]) => (
                <div key={cat} style={row}><span style={lbl}>{cat}</span><span style={val}>{fmt(amt)}</span></div>
              ))}
              <div style={rowLast}><span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>합계</span><span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmt(data.total_expenses)}</span></div>
            </section>
          )}

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>부가세 추정</h2>
            <div style={row}><span style={lbl}>공급가액 (매출 ÷ 1.1)</span><span style={val}>{fmt(data.vat.sales_tax_base)}</span></div>
            <div style={row}><span style={lbl}>매출세액</span><span style={val}>{fmt(data.vat.output_vat)}</span></div>
            <div style={row}><span style={lbl}>매입세액 공제</span><span style={val}>-{fmt(data.vat.input_vat)}</span></div>
            <div style={rowLast}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>납부 예상 부가세</span>
              <span style={{ fontWeight: 700, fontSize: '1.1em', color: '#facc15' }}>{fmt(data.vat.vat_payable)}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
