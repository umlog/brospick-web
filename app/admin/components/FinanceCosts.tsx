'use client';

import { useState, useEffect } from 'react';
import type { ProductCost } from '@/lib/domain/types';
import type { AdminProduct } from '@/lib/domain/types';
import { request } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import { todayLocal } from '../lib/datetime';
import { downloadCsv } from '../utils';
import styles from '../admin.module.css';

interface Props {
  products: AdminProduct[];
}

type CostRow = ProductCost & { products: { name: string } | null };

export function FinanceCosts({ products }: Props) {
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    color: '',
    cost_price: '',
    effective_date: todayLocal(),
    note: '',
  });

  useEffect(() => {
    fetchCosts();
  }, []);

  async function fetchCosts() {
    setLoading(true);
    try {
      setCosts(await request<CostRow[]>('/api/admin/finance/costs'));
    } catch {
      showToast('원가 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ product_id: '', color: '', cost_price: '', effective_date: todayLocal(), note: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(cost: CostRow) {
    setForm({
      product_id: String(cost.product_id),
      color: cost.color ?? '',
      cost_price: String(cost.cost_price),
      effective_date: cost.effective_date,
      note: cost.note ?? '',
    });
    setEditingId(cost.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      product_id: Number(form.product_id),
      color: form.color || null,
      cost_price: Number(form.cost_price),
      effective_date: form.effective_date,
      note: form.note || null,
    };

    const url = editingId ? `/api/admin/finance/costs/${editingId}` : '/api/admin/finance/costs';
    try {
      await request(url, { method: editingId ? 'PATCH' : 'POST', body: payload });
    } catch {
      showToast('저장 실패', 'error');
      return;
    }
    showToast(editingId ? '원가 수정 완료' : '원가 추가 완료', 'success');
    resetForm();
    fetchCosts();
  }

  async function handleDelete(id: string) {
    const ok = await showConfirm('이 원가 기록을 삭제할까요?');
    if (!ok) return;
    try {
      await request(`/api/admin/finance/costs/${id}`, { method: 'DELETE' });
      showToast('삭제 완료', 'success');
      fetchCosts();
    } catch {
      showToast('삭제 실패', 'error');
    }
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div className={styles.finHeaderRow}>
          <h2 className={`${styles.dashboardSectionTitle} ${styles.finHeaderTitle}`}>상품별 사입가 (실제 매입가)</h2>
          <div className={styles.finHeaderActions}>
            <button
              className={styles.refreshButton}
              disabled={costs.length === 0}
              onClick={() =>
                downloadCsv(
                  `사입가_${todayLocal()}.csv`,
                  ['상품명', '색상', '사입가', '적용시작일', '메모'],
                  costs.map((c) => [c.products?.name ?? `상품 #${c.product_id}`, c.color ?? '', c.cost_price, c.effective_date, c.note ?? '']),
                )
              }
            >
              CSV 다운로드
            </button>
            <button className={styles.refreshButton} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
              {showForm ? '취소' : '+ 원가 추가'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.finForm}>
            <div className={styles.finFormGrid}>
              <div>
                <label className={styles.finLabel}>상품 *</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value }))}
                  required
                  className={styles.finInput}
                >
                  <option value="">상품 선택</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.finLabel}>색상 (선택)</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="예: 블랙, 화이트"
                  className={styles.finInput}
                />
              </div>
              <div>
                <label className={styles.finLabel}>사입가 (원) *</label>
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => setForm(f => ({ ...f, cost_price: e.target.value }))}
                  required
                  min={0}
                  placeholder="0"
                  className={styles.finInput}
                />
              </div>
              <div>
                <label className={styles.finLabel}>적용 시작일 *</label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))}
                  required
                  className={styles.finInput}
                />
              </div>
              <div>
                <label className={styles.finLabel}>메모</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="선택 사항"
                  className={styles.finInput}
                />
              </div>
            </div>
            <div className={styles.finFormActions}>
              <button type="submit" className={styles.finSubmitBtn}>
                {editingId ? '수정' : '저장'}
              </button>
              <button type="button" onClick={resetForm} className={styles.refreshButton}>취소</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className={styles.loading}>불러오는 중...</p>
        ) : costs.length === 0 ? (
          <p className={styles.empty}>등록된 사입가가 없습니다. 실제 매입가를 등록하면 COGS(매출원가) 계산에 반영됩니다. 상품 페이지의 표시 원가(할인율용)와는 별개입니다.</p>
        ) : (
          <div className={styles.finTableWrap}>
            <table className={styles.finTable}>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>색상</th>
                  <th className={styles.finRight}>사입가</th>
                  <th>적용 시작일</th>
                  <th>메모</th>
                  <th className={styles.finCenter}>관리</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(c => (
                  <tr key={c.id}>
                    <td className={styles.finStrong}>{c.products?.name ?? `상품 #${c.product_id}`}</td>
                    <td>{c.color ?? '-'}</td>
                    <td className={`${styles.finRight} ${styles.finStrong}`}>₩{c.cost_price.toLocaleString()}</td>
                    <td>{c.effective_date}</td>
                    <td>{c.note ?? '-'}</td>
                    <td className={styles.finCenter}>
                      <button onClick={() => startEdit(c)} className={styles.finRowBtn}>수정</button>
                      <button onClick={() => handleDelete(c.id)} className={`${styles.finRowBtn} ${styles.finRowBtnDanger}`}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
