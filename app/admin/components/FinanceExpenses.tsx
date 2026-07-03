'use client';

import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory } from '@/lib/domain/types';
import { request } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import { todayLocal } from '../lib/datetime';
import { downloadCsv } from '../utils';
import styles from '../admin.module.css';

const CATEGORIES: ExpenseCategory[] = [
  '제품원가', '배송비(발송)', '배송비(반품)', '포장재',
  '마케팅/광고', '플랫폼수수료', '인건비', '임차료', '기타',
];

const emptyForm = () => ({
  date: todayLocal(),
  category: '' as ExpenseCategory | '',
  amount: '',
  description: '',
  receipt_url: '',
  vat_deductible: false,
  note: '',
});

export function FinanceExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      setExpenses(await request<Expense[]>('/api/admin/finance/expenses'));
    } catch {
      showToast('지출 내역을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(e: Expense) {
    setForm({
      date: e.date,
      category: e.category,
      amount: String(e.amount),
      description: e.description,
      receipt_url: e.receipt_url ?? '',
      vat_deductible: e.vat_deductible,
      note: e.note ?? '',
    });
    setEditingId(e.id);
    setShowForm(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const payload = {
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      receipt_url: form.receipt_url || null,
      vat_deductible: form.vat_deductible,
      note: form.note || null,
    };
    const url = editingId ? `/api/admin/finance/expenses/${editingId}` : '/api/admin/finance/expenses';
    try {
      await request(url, { method: editingId ? 'PATCH' : 'POST', body: payload });
    } catch {
      showToast('저장 실패', 'error');
      return;
    }
    showToast(editingId ? '지출 수정 완료' : '지출 추가 완료', 'success');
    resetForm();
    fetchExpenses();
  }

  async function handleDelete(id: string) {
    const ok = await showConfirm('이 지출 내역을 삭제할까요?');
    if (!ok) return;
    try {
      await request(`/api/admin/finance/expenses/${id}`, { method: 'DELETE' });
      showToast('삭제 완료', 'success');
      fetchExpenses();
    } catch {
      showToast('삭제 실패', 'error');
    }
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div className={styles.finHeaderRow}>
          <h2 className={`${styles.dashboardSectionTitle} ${styles.finHeaderTitle}`}>지출 내역</h2>
          <div className={styles.finHeaderActions}>
            <button
              className={styles.refreshButton}
              disabled={expenses.length === 0}
              onClick={() =>
                downloadCsv(
                  `지출내역_${todayLocal()}.csv`,
                  ['날짜', '카테고리', '금액', '내용', '부가세공제', '메모'],
                  expenses.map((e) => [e.date, e.category, e.amount, e.description, e.vat_deductible ? 'Y' : 'N', e.note ?? '']),
                )
              }
            >
              CSV 다운로드
            </button>
            <button className={styles.refreshButton} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
              {showForm ? '취소' : '+ 지출 추가'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.finForm}>
            <div className={styles.finFormGrid}>
              <div>
                <label className={styles.finLabel}>날짜 *</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required className={styles.finInput} />
              </div>
              <div>
                <label className={styles.finLabel}>카테고리 *</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} required className={styles.finInput}>
                  <option value="">선택</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.finLabel}>금액 (원) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} placeholder="0" className={styles.finInput} />
              </div>
              <div>
                <label className={styles.finLabel}>항목 설명 *</label>
                <input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="예: 네이버 광고비 5월" className={styles.finInput} />
              </div>
              <div>
                <label className={styles.finLabel}>영수증 URL</label>
                <input type="text" value={form.receipt_url} onChange={(e) => setForm(f => ({ ...f, receipt_url: e.target.value }))} placeholder="선택 사항" className={styles.finInput} />
              </div>
              <div>
                <label className={styles.finLabel}>메모</label>
                <input type="text" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="선택 사항" className={styles.finInput} />
              </div>
            </div>
            <label className={styles.finCheckbox}>
              <input type="checkbox" checked={form.vat_deductible} onChange={(e) => setForm(f => ({ ...f, vat_deductible: e.target.checked }))} />
              부가세 공제 가능 (세금계산서 있음)
            </label>
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
        ) : expenses.length === 0 ? (
          <p className={styles.empty}>등록된 지출 내역이 없습니다.</p>
        ) : (
          <div className={styles.finTableWrap}>
            <table className={styles.finTable}>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>카테고리</th>
                  <th>항목</th>
                  <th className={styles.finRight}>금액</th>
                  <th className={styles.finCenter}>VAT</th>
                  <th>메모</th>
                  <th className={styles.finCenter}>관리</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td className={styles.finStrong}>{e.category}</td>
                    <td className={styles.finStrong}>{e.description}</td>
                    <td className={`${styles.finRight} ${styles.finStrong}`}>₩{e.amount.toLocaleString()}</td>
                    <td className={`${styles.finCenter} ${e.vat_deductible ? styles.finPos : ''}`}>{e.vat_deductible ? '✓' : '-'}</td>
                    <td>{e.note ?? '-'}</td>
                    <td className={styles.finCenter}>
                      <button onClick={() => startEdit(e)} className={styles.finRowBtn}>수정</button>
                      <button onClick={() => handleDelete(e.id)} className={`${styles.finRowBtn} ${styles.finRowBtnDanger}`}>삭제</button>
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
