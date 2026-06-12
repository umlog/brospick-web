'use client';

import { useState } from 'react';
import type { SiteBanner } from '../hooks/useBanners';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

interface Props {
  state: ReturnType<typeof import('../hooks/useBanners').useBanners>;
}

const EMPTY: Omit<SiteBanner, 'id' | 'created_at'> = {
  message: '',
  link_url: null,
  bg_color: '#000000',
  text_color: '#ffffff',
  is_active: false,
  starts_at: null,
  ends_at: null,
};

export function BannerManager({ state }: Props) {
  const { banners, loading, createBanner, updateBanner, deleteBanner } = state;
  const [editing, setEditing] = useState<SiteBanner | null>(null);
  const [form, setForm] = useState<Omit<SiteBanner, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (b: SiteBanner) => {
    setEditing(b);
    setForm({ message: b.message, link_url: b.link_url, bg_color: b.bg_color,
      text_color: b.text_color, is_active: b.is_active, starts_at: b.starts_at, ends_at: b.ends_at });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) await updateBanner(editing.id, form);
    else await createBanner(form);
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (b: SiteBanner) => {
    const ok = await showConfirm(`배너를 삭제할까요?`);
    if (ok) deleteBanner(b.id);
  };

  const handleToggle = (b: SiteBanner) => updateBanner(b.id, { is_active: !b.is_active });

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  if (showForm) {
    return (
      <div className={styles.bmFormWrapper}>
        <div className={styles.bmFormHeader}>
          <button onClick={closeForm} className={styles.refreshButton}>← 목록으로</button>
          <h2 className={styles.bmFormTitle}>{editing ? '배너 수정' : '새 배너'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.bmForm}>
          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>배너 문구 *</label>
            <input className={styles.input} value={form.message}
              onChange={(e) => set('message', e.target.value)} required
              placeholder="지금 신제품 출시! 무료배송 진행 중 →" />
          </div>

          {/* 미리보기 */}
          {form.message && (
            <div className={styles.bannerPreview}
              style={{ backgroundColor: form.bg_color, color: form.text_color }}>
              {form.message}
            </div>
          )}

          <div className={styles.bmFormGrid}>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>링크 URL (선택)</label>
              <input className={styles.input} value={form.link_url ?? ''}
                onChange={(e) => set('link_url', e.target.value || null)} placeholder="/apparel" />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>배경색</label>
              <div className={styles.colorPickerRow}>
                <input type="color" value={form.bg_color}
                  onChange={(e) => set('bg_color', e.target.value)} />
                <input className={styles.input} value={form.bg_color}
                  onChange={(e) => set('bg_color', e.target.value)} placeholder="#000000" />
              </div>
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>글자색</label>
              <div className={styles.colorPickerRow}>
                <input type="color" value={form.text_color}
                  onChange={(e) => set('text_color', e.target.value)} />
                <input className={styles.input} value={form.text_color}
                  onChange={(e) => set('text_color', e.target.value)} placeholder="#ffffff" />
              </div>
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>시작일 (선택)</label>
              <input type="datetime-local" className={styles.input}
                value={form.starts_at ? form.starts_at.slice(0, 16) : ''}
                onChange={(e) => set('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>종료일 (선택)</label>
              <input type="datetime-local" className={styles.input}
                value={form.ends_at ? form.ends_at.slice(0, 16) : ''}
                onChange={(e) => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
          </div>

          <div className={styles.popupCheckboxRow}>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} />
              활성화 (사이트 상단에 표시)
            </label>
          </div>

          <div className={styles.bmFormActions}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>취소</button>
            <button type="submit" className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`} disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정 저장' : '배너 생성'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.bmListHeader}>
        <button onClick={openCreate} className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`}>
          + 새 배너
        </button>
        <p className={styles.pmDesc}>활성 배너는 1개만 사이트 상단에 표시됩니다.</p>
      </div>

      {banners.length === 0 ? (
        <p className={styles.bmEmpty}>배너가 없습니다.</p>
      ) : (
        <div className={styles.bmList}>
          {banners.map((b) => (
            <div key={b.id} className={styles.bmCard}>
              <div className={styles.bannerCardPreview}
                style={{ backgroundColor: b.bg_color, color: b.text_color }}>
                {b.message}
              </div>
              <div className={styles.bmCardInfo}>
                <div className={styles.bmCardNameRow}>
                  <span className={`${styles.bmStatusBadge} ${b.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {b.is_active ? '활성' : '비활성'}
                  </span>
                  <span className={styles.bmCardMeta}>
                    {b.link_url ?? '링크 없음'}
                  </span>
                </div>
              </div>
              <div className={styles.bmCardActions}>
                <button onClick={() => handleToggle(b)}
                  className={`${styles.refreshButton} ${b.is_active ? styles.bmDeleteBtn : styles.bmPrimaryBtn}`}>
                  {b.is_active ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => openEdit(b)} className={styles.refreshButton}>수정</button>
                <button onClick={() => handleDelete(b)} className={`${styles.refreshButton} ${styles.bmDeleteBtn}`}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
