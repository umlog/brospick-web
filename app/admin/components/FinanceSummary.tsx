'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface SummaryData {
  period: { from: string; to: string };
  revenue: {
    gross: number;
    product_revenue: number;
    cancel_refunds: number;
    return_refunds: number;
    exchange_shipping_income: number;
    net: number;
    ebook: number;
    total_net: number;
    order_count: number;
    return_count: number;
    exchange_count: number;
  };
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  expenses_by_category: Record<string, number>;
  total_expenses: number;
  operating_income: number;
  shipping: {
    collected: number;
    return_collected: number;
    exchange_collected: number;
    expense_out: number;
    net_income: number;
    paid_order_count: number;
    free_order_count: number;
    remote_area_count: number;
  };
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
            <div style={row}><span style={{ ...lbl, paddingLeft: 12 }}>ㄴ 상품 매출</span><span style={val}>{fmt(data.revenue.product_revenue)}</span></div>
            <div style={row}><span style={{ ...lbl, paddingLeft: 12 }}>ㄴ 수취 배송비</span><span style={val}>{fmt(data.shipping.collected)}</span></div>
            <div style={row}><span style={lbl}>취소 환불</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.revenue.cancel_refunds)}</span></div>
            {data.revenue.return_refunds > 0 && (
              <div style={row}><span style={lbl}>반품 환불 ({data.revenue.return_count}건)</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.revenue.return_refunds)}</span></div>
            )}
            {data.revenue.exchange_shipping_income > 0 && (
              <div style={row}><span style={lbl}>교환 배송비 수입 ({data.revenue.exchange_count}건)</span><span style={val}>+{fmt(data.revenue.exchange_shipping_income)}</span></div>
            )}
            <div style={row}><span style={lbl}>순 매출 (주문)</span><span style={val}>{fmt(data.revenue.net)}</span></div>
            <div style={row}><span style={lbl}>전자책 매출</span><span style={val}>{fmt(data.revenue.ebook)}</span></div>
            <div style={rowLast}><span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>총 순매출</span><span style={{ fontWeight: 700, fontSize: '1.1em', color: 'var(--color-accent)' }}>{fmt(data.revenue.total_net)}</span></div>
          </section>

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>손익 계산</h2>
            <div style={row}><span style={lbl}>순매출</span><span style={val}>{fmt(data.revenue.total_net)}</span></div>
            <div style={row}><span style={lbl}>매출원가 COGS (사입가 기준)</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.cogs)}</span></div>
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
            <h2 className={styles.dashboardSectionTitle}>배송비</h2>
            <div className={styles.dashboardGrid} style={{ marginBottom: 'var(--space-md)' }}>
              <div className={styles.dashboardCard}>
                <div style={{ fontSize: 'var(--size-xs)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>유료배송</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{data.shipping.paid_order_count}건</div>
              </div>
              <div className={styles.dashboardCard}>
                <div style={{ fontSize: 'var(--size-xs)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>무료배송</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{data.shipping.free_order_count}건</div>
              </div>
              <div className={styles.dashboardCard}>
                <div style={{ fontSize: 'var(--size-xs)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>도서산간</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{data.shipping.remote_area_count}건</div>
              </div>
            </div>
            <div style={row}><span style={lbl}>수취 배송비 (구매)</span><span style={val}>{fmt(data.shipping.collected)}</span></div>
            <div style={row}>
              <span style={lbl}>수취 배송비 (반품, {data.revenue.return_count}건)</span>
              <span style={{ ...val, color: 'var(--color-text-secondary)', fontSize: '0.85em' }}>{fmt(data.shipping.return_collected)} ※ 환불액에 반영됨</span>
            </div>
            <div style={row}><span style={lbl}>수취 배송비 (교환, {data.revenue.exchange_count}건)</span><span style={val}>{fmt(data.shipping.exchange_collected)}</span></div>
            <div style={row}><span style={lbl}>지출 배송비 (발송+반품)</span><span style={{ fontWeight: 600, color: '#f87171' }}>-{fmt(data.shipping.expense_out)}</span></div>
            {data.shipping.expense_out === 0 && (
              <div style={{ fontSize: 'var(--size-xs)', color: '#facc15', marginBottom: 'var(--space-sm)' }}>
                ⚠ 지출 내역에 배송비(발송) / 배송비(반품)가 입력되지 않았습니다.
              </div>
            )}
            <div style={rowLast}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>배송비 손익</span>
              <span style={{ fontWeight: 700, fontSize: '1.1em', color: data.shipping.net_income >= 0 ? '#4ade80' : '#f87171' }}>{fmt(data.shipping.net_income)}</span>
            </div>
          </section>

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
