'use client';

import { useState } from 'react';
import type { Coupon, CouponFormData } from '../hooks/useCoupons';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

interface Props {
  state: ReturnType<typeof import('../hooks/useCoupons').useCoupons>;
}

const EMPTY: CouponFormData = {
  code: '',
  discount_type: 'amount',
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: null,
  max_uses: null,
  is_active: true,
  expires_at: null,
  description: '',
};

export function CouponManager({ state }: Props) {
  const { coupons, loading, createCoupon, updateCoupon, deleteCoupon } = state;
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormData>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      min_order_amount: c.min_order_amount, max_discount_amount: c.max_discount_amount,
      max_uses: c.max_uses, is_active: c.is_active, expires_at: c.expires_at, description: c.description });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const set = <K extends keyof CouponFormData>(k: K, v: CouponFormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) await updateCoupon(editing.id, form);
    else await createCoupon(form);
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (c: Coupon) => {
    const ok = await showConfirm(`"${c.code}" 쿠폰을 삭제할까요?`);
    if (ok) deleteCoupon(c.id);
  };

  const handleToggle = (c: Coupon) => updateCoupon(c.id, { is_active: !c.is_active });

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    set('code', code);
  };

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  if (showForm) {
    return (
      <div className={styles.bmFormWrapper}>
        <div className={styles.bmFormHeader}>
          <button onClick={closeForm} className={styles.refreshButton}>← 목록으로</button>
          <h2 className={styles.bmFormTitle}>{editing ? '쿠폰 수정' : '새 쿠폰'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.bmForm}>
          <div className={styles.bmFormGrid}>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>쿠폰 코드 *</label>
              <div className={styles.couponCodeRow}>
                <input className={styles.input} value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  required placeholder="SUMMER2025" style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }} />
                <button type="button" onClick={generateCode} className={styles.refreshButton}>자동생성</button>
              </div>
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>설명 (내부용)</label>
              <input className={styles.input} value={form.description}
                onChange={(e) => set('description', e.target.value)} placeholder="여름 시즌 프로모션" />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>할인 유형 *</label>
              <select className={styles.input} value={form.discount_type}
                onChange={(e) => set('discount_type', e.target.value as 'amount' | 'percent')}>
                <option value="amount">금액 할인 (원)</option>
                <option value="percent">비율 할인 (%)</option>
              </select>
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>
                할인 {form.discount_type === 'amount' ? '금액 (원)' : '비율 (%)'} *
              </label>
              <input type="number" className={styles.input} value={form.discount_value}
                min={1} max={form.discount_type === 'percent' ? 100 : undefined}
                onChange={(e) => set('discount_value', parseInt(e.target.value, 10) || 0)} required />
            </div>
            {form.discount_type === 'percent' && (
              <div className={styles.bmField}>
                <label className={styles.bmFieldLabel}>최대 할인 금액 (원, 선택)</label>
                <input type="number" className={styles.input}
                  value={form.max_discount_amount ?? ''}
                  onChange={(e) => set('max_discount_amount', e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="비율 할인 최대 한도" />
              </div>
            )}
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>최소 주문 금액 (원)</label>
              <input type="number" className={styles.input} value={form.min_order_amount}
                min={0} onChange={(e) => set('min_order_amount', parseInt(e.target.value, 10) || 0)} />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>최대 사용 횟수 (선택, 비워두면 무제한)</label>
              <input type="number" className={styles.input} value={form.max_uses ?? ''}
                min={1} onChange={(e) => set('max_uses', e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="무제한" />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>만료일 (선택)</label>
              <input type="datetime-local" className={styles.input}
                value={form.expires_at ? form.expires_at.slice(0, 16) : ''}
                onChange={(e) => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
          </div>
          <div className={styles.popupCheckboxRow}>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} />
              활성화
            </label>
          </div>
          <div className={styles.bmFormActions}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>취소</button>
            <button type="submit" className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`} disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정 저장' : '쿠폰 생성'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const activeCoupons = coupons.filter((c) => c.is_active);
  const inactiveCoupons = coupons.filter((c) => !c.is_active);

  return (
    <div>
      <div className={styles.bmListHeader}>
        <button onClick={openCreate} className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`}>
          + 쿠폰 생성
        </button>
        <p className={styles.pmDesc}>활성: {activeCoupons.length}개 · 비활성: {inactiveCoupons.length}개</p>
      </div>

      {coupons.length === 0 ? (
        <p className={styles.bmEmpty}>쿠폰이 없습니다.</p>
      ) : (
        <div className={styles.bmList}>
          {coupons.map((c) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const isMaxed = c.max_uses !== null && c.used_count >= c.max_uses;
            return (
              <div key={c.id} className={`${styles.bmCard} ${!c.is_active ? styles.couponInactive : ''}`}>
                <div className={styles.bmCardInfo}>
                  <div className={styles.bmCardNameRow}>
                    <strong className={styles.couponCode}>{c.code}</strong>
                    <span className={`${styles.bmStatusBadge} ${c.is_active && !isExpired && !isMaxed ? styles.badgeActive : styles.badgeInactive}`}>
                      {isExpired ? '만료됨' : isMaxed ? '소진됨' : c.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <p className={styles.bmCardMeta}>
                    {c.discount_type === 'amount'
                      ? `${c.discount_value.toLocaleString()}원 할인`
                      : `${c.discount_value}% 할인${c.max_discount_amount ? ` (최대 ${c.max_discount_amount.toLocaleString()}원)` : ''}`}
                    {c.min_order_amount > 0 && ` · 최소 ${c.min_order_amount.toLocaleString()}원`}
                  </p>
                  <p className={styles.bmCardDate}>
                    사용: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}회
                    {c.expires_at && ` · 만료: ${c.expires_at.slice(0, 10)}`}
                    {c.description && ` · ${c.description}`}
                  </p>
                </div>
                <div className={styles.bmCardActions}>
                  <button onClick={() => handleToggle(c)}
                    className={`${styles.refreshButton} ${c.is_active ? styles.bmDeleteBtn : styles.bmPrimaryBtn}`}>
                    {c.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => openEdit(c)} className={styles.refreshButton}>수정</button>
                  <button onClick={() => handleDelete(c)} className={`${styles.refreshButton} ${styles.bmDeleteBtn}`}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
