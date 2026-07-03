'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { todayLocal } from '../lib/datetime';
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
  monthly: { month: string; revenue: number; ebook: number; expenses: number; profit: number }[];
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

export function FinanceSummary() {
  const thisYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${thisYear}-01-01`);
  const [to, setTo] = useState(todayLocal());
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSummary(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSummary() {
    setLoading(true);
    try {
      setData(await request<SummaryData>(`/api/admin/finance/summary?from=${from}&to=${to}`));
    } catch {
      showToast('재무 요약을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div className={styles.finFilterRow}>
          <div>
            <label className={styles.finLabel}>시작일</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${styles.finInput} ${styles.finInputAuto}`} />
          </div>
          <div>
            <label className={styles.finLabel}>종료일</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${styles.finInput} ${styles.finInputAuto}`} />
          </div>
          <button onClick={fetchSummary} className={styles.refreshButton}>조회</button>
        </div>
      </section>

      {loading && <p className={styles.loading}>불러오는 중...</p>}

      {data && (
        <>
          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>매출</h2>
            <div className={styles.finRow}><span className={styles.finLbl}>총 매출 (주문 {data.revenue.order_count}건)</span><span className={styles.finVal}>{fmt(data.revenue.gross)}</span></div>
            <div className={styles.finRow}><span className={`${styles.finLbl} ${styles.finLblIndent}`}>ㄴ 상품 매출</span><span className={styles.finVal}>{fmt(data.revenue.product_revenue)}</span></div>
            <div className={styles.finRow}><span className={`${styles.finLbl} ${styles.finLblIndent}`}>ㄴ 수취 배송비</span><span className={styles.finVal}>{fmt(data.shipping.collected)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>취소 환불</span><span className={`${styles.finVal} ${styles.finNeg}`}>-{fmt(data.revenue.cancel_refunds)}</span></div>
            {data.revenue.return_refunds > 0 && (
              <div className={styles.finRow}><span className={styles.finLbl}>반품 환불 ({data.revenue.return_count}건)</span><span className={`${styles.finVal} ${styles.finNeg}`}>-{fmt(data.revenue.return_refunds)}</span></div>
            )}
            {data.revenue.exchange_shipping_income > 0 && (
              <div className={styles.finRow}><span className={styles.finLbl}>교환 배송비 수입 ({data.revenue.exchange_count}건)</span><span className={styles.finVal}>+{fmt(data.revenue.exchange_shipping_income)}</span></div>
            )}
            <div className={styles.finRow}><span className={styles.finLbl}>순 매출 (주문)</span><span className={styles.finVal}>{fmt(data.revenue.net)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>전자책 매출</span><span className={styles.finVal}>{fmt(data.revenue.ebook)}</span></div>
            <div className={`${styles.finRow} ${styles.finRowLast}`}><span className={styles.finTotalLbl}>총 순매출</span><span className={`${styles.finTotalVal} ${styles.finAccent}`}>{fmt(data.revenue.total_net)}</span></div>
          </section>

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>손익 계산</h2>
            <div className={styles.finRow}><span className={styles.finLbl}>순매출</span><span className={styles.finVal}>{fmt(data.revenue.total_net)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>매출원가 COGS (사입가 기준)</span><span className={`${styles.finVal} ${styles.finNeg}`}>-{fmt(data.cogs)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>매출총이익</span><span className={styles.finVal}>{fmt(data.gross_profit)} ({data.gross_margin_pct}%)</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>총 지출</span><span className={`${styles.finVal} ${styles.finNeg}`}>-{fmt(data.total_expenses)}</span></div>
            <div className={`${styles.finRow} ${styles.finRowLast}`}>
              <span className={styles.finTotalLbl}>영업이익</span>
              <span className={`${styles.finTotalVal} ${data.operating_income >= 0 ? styles.finPos : styles.finNeg}`}>{fmt(data.operating_income)}</span>
            </div>
          </section>

          {data.monthly.length > 0 && (
            <section className={styles.dashboardSection}>
              <h2 className={styles.dashboardSectionTitle}>월별 추이</h2>
              <div className={styles.finTableWrap}>
                <table className={styles.finTable}>
                  <thead>
                    <tr>
                      <th>월</th>
                      <th className={styles.finRight}>매출</th>
                      <th className={styles.finRight}>전자책</th>
                      <th className={styles.finRight}>지출</th>
                      <th className={styles.finRight}>손익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map((m) => (
                      <tr key={m.month}>
                        <td className={styles.finStrong}>{m.month}</td>
                        <td className={`${styles.finRight} ${styles.finStrong}`}>{fmt(m.revenue)}</td>
                        <td className={`${styles.finRight} ${styles.finStrong}`}>{fmt(m.ebook)}</td>
                        <td className={`${styles.finRight} ${styles.finNeg}`}>-{fmt(m.expenses)}</td>
                        <td className={`${styles.finRight} ${styles.finStrong} ${m.profit >= 0 ? styles.finPos : styles.finNeg}`}>{fmt(m.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.finNote}>※ 총매출 기준 단순 추이 (환불·COGS 미반영, KST 월 기준)</p>
            </section>
          )}

          {Object.keys(data.expenses_by_category).length > 0 && (
            <section className={styles.dashboardSection}>
              <h2 className={styles.dashboardSectionTitle}>지출 항목별</h2>
              {Object.entries(data.expenses_by_category).map(([cat, amt]) => (
                <div key={cat} className={styles.finRow}><span className={styles.finLbl}>{cat}</span><span className={styles.finVal}>{fmt(amt)}</span></div>
              ))}
              <div className={`${styles.finRow} ${styles.finRowLast}`}><span className={styles.finTotalLbl}>합계</span><span className={styles.finTotalLbl}>{fmt(data.total_expenses)}</span></div>
            </section>
          )}

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>배송비</h2>
            <div className={styles.dashboardGrid} style={{ marginBottom: 'var(--space-md)' }}>
              <div className={styles.dashboardCard}>
                <div className={styles.finCardLabel}>유료배송</div>
                <div className={styles.finCardValue}>{data.shipping.paid_order_count}건</div>
              </div>
              <div className={styles.dashboardCard}>
                <div className={styles.finCardLabel}>무료배송</div>
                <div className={styles.finCardValue}>{data.shipping.free_order_count}건</div>
              </div>
              <div className={styles.dashboardCard}>
                <div className={styles.finCardLabel}>도서산간</div>
                <div className={styles.finCardValue}>{data.shipping.remote_area_count}건</div>
              </div>
            </div>
            <div className={styles.finRow}><span className={styles.finLbl}>수취 배송비 (구매)</span><span className={styles.finVal}>{fmt(data.shipping.collected)}</span></div>
            <div className={styles.finRow}>
              <span className={styles.finLbl}>수취 배송비 (반품, {data.revenue.return_count}건)</span>
              <span className={styles.finSubNote}>{fmt(data.shipping.return_collected)} ※ 환불액에 반영됨</span>
            </div>
            <div className={styles.finRow}><span className={styles.finLbl}>수취 배송비 (교환, {data.revenue.exchange_count}건)</span><span className={styles.finVal}>{fmt(data.shipping.exchange_collected)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>지출 배송비 (발송+반품)</span><span className={`${styles.finVal} ${styles.finNeg}`}>-{fmt(data.shipping.expense_out)}</span></div>
            {data.shipping.expense_out === 0 && (
              <div className={styles.finVatWarn}>
                ⚠ 지출 내역에 배송비(발송) / 배송비(반품)가 입력되지 않았습니다.
              </div>
            )}
            <div className={`${styles.finRow} ${styles.finRowLast}`}>
              <span className={styles.finTotalLbl}>배송비 손익</span>
              <span className={`${styles.finTotalVal} ${data.shipping.net_income >= 0 ? styles.finPos : styles.finNeg}`}>{fmt(data.shipping.net_income)}</span>
            </div>
          </section>

          <section className={styles.dashboardSection}>
            <h2 className={styles.dashboardSectionTitle}>부가세 추정</h2>
            <div className={styles.finRow}><span className={styles.finLbl}>공급가액 (매출 ÷ 1.1)</span><span className={styles.finVal}>{fmt(data.vat.sales_tax_base)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>매출세액</span><span className={styles.finVal}>{fmt(data.vat.output_vat)}</span></div>
            <div className={styles.finRow}><span className={styles.finLbl}>매입세액 공제</span><span className={styles.finVal}>-{fmt(data.vat.input_vat)}</span></div>
            <div className={`${styles.finRow} ${styles.finRowLast}`}>
              <span className={styles.finTotalLbl}>납부 예상 부가세</span>
              <span className={styles.finWarnVal}>{fmt(data.vat.vat_payable)}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
