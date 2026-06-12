'use client';

import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory } from '@/lib/domain/types';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

const CATEGORIES: ExpenseCategory[] = [
  '제품원가', '배송비(발송)', '배송비(반품)', '포장재',
  '마케팅/광고', '플랫폼수수료', '인건비', '임차료', '기타',
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)',
  border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)',
  fontSize: 'var(--size-sm)', boxSizing: 'border-box',
};

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
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
    const res = await fetch('/api/admin/finance/expenses');
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
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
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { showToast('저장 실패', 'error'); return; }
    showToast(editingId ? '지출 수정 완료' : '지출 추가 완료', 'success');
    resetForm();
    fetchExpenses();
  }

  async function handleDelete(id: string) {
    const ok = await showConfirm('이 지출 내역을 삭제할까요?');
    if (!ok) return;
    const res = await fetch(`/api/admin/finance/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('삭제 완료', 'success'); fetchExpenses(); }
    else showToast('삭제 실패', 'error');
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className={styles.dashboardSectionTitle} style={{ marginBottom: 0 }}>지출 내역</h2>
          <button className={styles.refreshButton} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
            {showForm ? '취소' : '+ 지출 추가'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>날짜 *</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>카테고리 *</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} required style={inputStyle}>
                  <option value="">선택</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>금액 (원) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>항목 설명 *</label>
                <input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="예: 네이버 광고비 5월" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>영수증 URL</label>
                <input type="text" value={form.receipt_url} onChange={(e) => setForm(f => ({ ...f, receipt_url: e.target.value }))} placeholder="선택 사항" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>메모</label>
                <input type="text" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="선택 사항" style={inputStyle} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--size-sm)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.vat_deductible} onChange={(e) => setForm(f => ({ ...f, vat_deductible: e.target.checked }))} />
              부가세 공제 가능 (세금계산서 있음)
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button type="submit" style={{ padding: 'var(--space-sm) var(--space-lg)', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--size-sm)' }}>
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>날짜</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>카테고리</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>항목</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>금액</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>VAT</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>메모</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>{e.date}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-primary)' }}>{e.category}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-primary)' }}>{e.description}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>₩{e.amount.toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', color: e.vat_deductible ? '#4ade80' : 'var(--color-text-secondary)' }}>{e.vat_deductible ? '✓' : '-'}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>{e.note ?? '-'}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                      <button onClick={() => startEdit(e)} style={{ marginRight: 8, padding: '2px 10px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>수정</button>
                      <button onClick={() => handleDelete(e.id)} style={{ padding: '2px 10px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 4, background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>삭제</button>
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
