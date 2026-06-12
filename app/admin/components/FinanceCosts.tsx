'use client';

import { useState, useEffect } from 'react';
import type { ProductCost } from '@/lib/domain/types';
import type { AdminProduct } from '@/lib/domain/types';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

interface Props {
  products: AdminProduct[];
}

export function FinanceCosts({ products }: Props) {
  const [costs, setCosts] = useState<(ProductCost & { products: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    color: '',
    cost_price: '',
    effective_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    fetchCosts();
  }, []);

  async function fetchCosts() {
    setLoading(true);
    const res = await fetch('/api/admin/finance/costs');
    if (res.ok) setCosts(await res.json());
    setLoading(false);
  }

  function resetForm() {
    setForm({ product_id: '', color: '', cost_price: '', effective_date: new Date().toISOString().split('T')[0], note: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(cost: ProductCost & { products: { name: string } | null }) {
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
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (!res.ok) {
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
    const res = await fetch(`/api/admin/finance/costs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('삭제 완료', 'success');
      fetchCosts();
    } else {
      showToast('삭제 실패', 'error');
    }
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className={styles.dashboardSectionTitle} style={{ marginBottom: 0 }}>상품별 원가</h2>
          <button className={styles.refreshButton} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
            {showForm ? '취소' : '+ 원가 추가'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>상품 *</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value }))}
                  required
                  style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)' }}
                >
                  <option value="">상품 선택</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>색상 (선택)</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="예: 블랙, 화이트"
                  style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>원가 (원) *</label>
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => setForm(f => ({ ...f, cost_price: e.target.value }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>적용 시작일 *</label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))}
                  required
                  style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>메모</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="선택 사항"
                  style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--color-bg-primary, #0a0a0a)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-primary)', fontSize: 'var(--size-sm)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
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
        ) : costs.length === 0 ? (
          <p className={styles.empty}>등록된 원가가 없습니다. 상품별 원가를 등록하면 손익 계산에 반영됩니다.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>상품명</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>색상</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>원가</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>적용 시작일</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>메모</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-primary)' }}>{c.products?.name ?? `상품 #${c.product_id}`}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>{c.color ?? '-'}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>₩{c.cost_price.toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>{c.effective_date}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>{c.note ?? '-'}</td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                      <button onClick={() => startEdit(c)} style={{ marginRight: 8, padding: '2px 10px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>수정</button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '2px 10px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 4, background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>삭제</button>
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
