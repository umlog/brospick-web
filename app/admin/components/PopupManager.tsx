'use client';

import { useState, useEffect } from 'react';
import type { SitePopup } from '../hooks/usePopups';
import { request } from '@/lib/api-client';
import { showConfirm } from '../lib/confirm';
import { showToast } from '../lib/toast';
import { toDatetimeLocalValue, toLocalDateString } from '../lib/datetime';
import styles from '../admin.module.css';

interface Props {
  state: ReturnType<typeof import('../hooks/usePopups').usePopups>;
}

const EMPTY: Omit<SitePopup, 'id' | 'created_at'> = {
  title: '',
  content: '',
  image_url: null,
  link_url: null,
  is_active: false,
  show_once: true,
  starts_at: null,
  ends_at: null,
};

export function PopupManager({ state }: Props) {
  const { popups, loading, createPopup, updatePopup, deletePopup } = state;
  const [editing, setEditing] = useState<SitePopup | null>(null);
  const [form, setForm] = useState<Omit<SitePopup, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p: SitePopup) => {
    setEditing(p);
    setForm({ title: p.title, content: p.content, image_url: p.image_url, link_url: p.link_url,
      is_active: p.is_active, show_once: p.show_once, starts_at: p.starts_at, ends_at: p.ends_at });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) await updatePopup(editing.id, form);
    else await createPopup(form);
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (p: SitePopup) => {
    const ok = await showConfirm(`"${p.title}" 팝업을 삭제할까요?`);
    if (ok) deletePopup(p.id);
  };

  const handleToggle = (p: SitePopup) => updatePopup(p.id, { is_active: !p.is_active });

  const [splashEnabled, setSplashEnabled] = useState(true);
  useEffect(() => {
    request<Record<string, string>>('/api/admin/site-settings')
      .then((d) => setSplashEnabled(d.splash_screen_enabled !== 'false'))
      .catch(() => showToast('사이트 설정을 불러오지 못했습니다.', 'error'));
  }, []);
  const toggleSplash = async () => {
    const next = !splashEnabled;
    setSplashEnabled(next);
    try {
      await request('/api/admin/site-settings', {
        method: 'PATCH',
        body: { splash_screen_enabled: next ? 'true' : 'false' },
      });
    } catch {
      setSplashEnabled(!next);
      showToast('스플래시 설정 저장에 실패했습니다.', 'error');
    }
  };

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  if (showForm) {
    return (
      <div className={styles.bmFormWrapper}>
        <div className={styles.bmFormHeader}>
          <button onClick={closeForm} className={styles.refreshButton}>← 목록으로</button>
          <h2 className={styles.bmFormTitle}>{editing ? '팝업 수정' : '새 팝업'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.bmForm}>
          <div className={styles.bmFormGrid}>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>제목 *</label>
              <input className={styles.input} value={form.title}
                onChange={(e) => set('title', e.target.value)} required placeholder="이벤트 안내" />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>버튼 링크 URL</label>
              <input className={styles.input} value={form.link_url ?? ''}
                onChange={(e) => set('link_url', e.target.value || null)} placeholder="/apparel" />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>이미지 URL</label>
              <input className={styles.input} value={form.image_url ?? ''}
                onChange={(e) => set('image_url', e.target.value || null)} placeholder="/popup-banner.jpg" />
              {form.image_url && (
                <img src={form.image_url} alt="미리보기" className={styles.imgPreview} />
              )}
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>시작일 (선택)</label>
              <input type="datetime-local" className={styles.input}
                value={form.starts_at ? toDatetimeLocalValue(form.starts_at) : ''}
                onChange={(e) => set('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>종료일 (선택)</label>
              <input type="datetime-local" className={styles.input}
                value={form.ends_at ? toDatetimeLocalValue(form.ends_at) : ''}
                onChange={(e) => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
          </div>

          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>본문 내용 *</label>
            <textarea className={styles.input} value={form.content} rows={4} required
              onChange={(e) => set('content', e.target.value)} placeholder="팝업에 표시될 내용" />
          </div>

          <div className={styles.popupCheckboxRow}>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} />
              활성화 (사이트에 표시)
            </label>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.show_once}
                onChange={(e) => set('show_once', e.target.checked)} />
              오늘 하루 보지 않기 옵션 표시
            </label>
          </div>

          <div className={styles.bmFormActions}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>취소</button>
            <button type="submit" className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`} disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정 저장' : '팝업 생성'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.splashToggleRow}>
        <span className={styles.splashToggleLabel}>스플래시 스크린</span>
        <button
          className={splashEnabled ? styles.toggleOn : styles.toggleOff}
          onClick={toggleSplash}
        >
          {splashEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className={styles.bmListHeader}>
        <button onClick={openCreate} className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`}>
          + 새 팝업
        </button>
      </div>

      {popups.length === 0 ? (
        <p className={styles.bmEmpty}>팝업이 없습니다.</p>
      ) : (
        <div className={styles.bmList}>
          {popups.map((p) => (
            <div key={p.id} className={styles.bmCard}>
              <div className={styles.bmCardInfo}>
                <div className={styles.bmCardNameRow}>
                  <strong className={styles.bmCardName}>{p.title}</strong>
                  <span className={`${styles.bmStatusBadge} ${p.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {p.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <p className={styles.bmCardDate}>
                  {p.starts_at ? `${toLocalDateString(p.starts_at)} ~` : '상시'}{' '}
                  {p.ends_at ? toLocalDateString(p.ends_at) : ''}
                </p>
              </div>
              <div className={styles.bmCardActions}>
                <button onClick={() => handleToggle(p)}
                  className={`${styles.refreshButton} ${p.is_active ? styles.bmDeleteBtn : styles.bmPrimaryBtn}`}>
                  {p.is_active ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => openEdit(p)} className={styles.refreshButton}>수정</button>
                <button onClick={() => handleDelete(p)} className={`${styles.refreshButton} ${styles.bmDeleteBtn}`}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
