'use client';

import { useState } from 'react';
import type { InstagramPost } from '../hooks/useInstagramPosts';
import { showConfirm } from '../lib/confirm';
import { showToast } from '../lib/toast';
import styles from '../admin.module.css';

interface Props {
  state: ReturnType<typeof import('../hooks/useInstagramPosts').useInstagramPosts>;
}

type PostForm = Omit<InstagramPost, 'id' | 'created_at'>;

const EMPTY: PostForm = {
  post_url: '',
  image_url: '',
  caption: null,
  is_video: false,
  sort_order: 0,
  is_active: true,
};

export function InstagramManager({ state }: Props) {
  const { posts, loading, createPost, updatePost, deletePost } = state;
  const [editing, setEditing] = useState<InstagramPost | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    // 새 게시물은 항상 목록 끝에 붙도록 현재 최대 정렬값 + 1
    const nextOrder = posts.length ? Math.max(...posts.map((p) => p.sort_order)) + 1 : 0;
    setForm({ ...EMPTY, sort_order: nextOrder });
    setShowForm(true);
  };

  const openEdit = (p: InstagramPost) => {
    setEditing(p);
    setForm({
      post_url: p.post_url, image_url: p.image_url, caption: p.caption,
      is_video: p.is_video, sort_order: p.sort_order, is_active: p.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };
  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/instagram/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');
      set('image_url', data.url);
      showToast('이미지 업로드 완료', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) await updatePost(editing.id, form);
    else await createPost(form);
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (p: InstagramPost) => {
    const ok = await showConfirm('이 게시물을 목록에서 삭제할까요?');
    if (ok) deletePost(p.id);
  };

  const handleToggle = (p: InstagramPost) => updatePost(p.id, { is_active: !p.is_active });

  // 이웃과 sort_order를 맞바꿔 순서를 이동한다.
  const handleMove = async (index: number, direction: -1 | 1) => {
    const current = posts[index];
    const neighbor = posts[index + direction];
    if (!current || !neighbor) return;
    await updatePost(current.id, { sort_order: neighbor.sort_order });
    await updatePost(neighbor.id, { sort_order: current.sort_order });
    state.fetchPosts();
  };

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  if (showForm) {
    return (
      <div className={styles.bmFormWrapper}>
        <div className={styles.bmFormHeader}>
          <button onClick={closeForm} className={styles.refreshButton}>← 목록으로</button>
          <h2 className={styles.bmFormTitle}>{editing ? '게시물 수정' : '새 게시물'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.bmForm}>
          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>썸네일 이미지 *</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            <input className={styles.input} value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)} required
              placeholder="업로드하면 자동 입력됩니다 (URL 직접 입력도 가능)" />
            {uploading && <p className={styles.pmDesc}>업로드 중...</p>}
            {form.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.image_url} alt="썸네일 미리보기" className={styles.igThumbPreview} />
            )}
          </div>

          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>인스타 게시물 URL *</label>
            <input className={styles.input} value={form.post_url}
              onChange={(e) => set('post_url', e.target.value)} required
              placeholder="https://www.instagram.com/p/XXXXXXXX/" />
          </div>

          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>캡션 (선택, 한 줄)</label>
            <input className={styles.input} value={form.caption ?? ''}
              onChange={(e) => set('caption', e.target.value || null)}
              placeholder="양주시민축구단 인터뷰 현장" />
          </div>

          <div className={styles.bmFormGrid}>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>정렬 순서 (작을수록 먼저)</label>
              <input type="number" className={styles.input} value={form.sort_order}
                onChange={(e) => set('sort_order', Number(e.target.value))} />
            </div>
          </div>

          <div className={styles.popupCheckboxRow}>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.is_video}
                onChange={(e) => set('is_video', e.target.checked)} />
              릴스/영상 (재생 아이콘 표시)
            </label>
            <label className={styles.popupCheckbox}>
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} />
              활성화 (메인에 표시)
            </label>
          </div>

          <div className={styles.bmFormActions}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>취소</button>
            <button type="submit" className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`}
              disabled={saving || uploading}>
              {saving ? '저장 중...' : editing ? '수정 저장' : '게시물 추가'}
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
          + 새 게시물
        </button>
        <p className={styles.pmDesc}>
          메인 &quot;우리는 이렇게 일합니다&quot; 섹션에 활성 게시물이 최대 6개까지 표시됩니다.
          인스타에서 이미지를 저장해 업로드하고, 해당 게시물 링크를 붙이세요.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className={styles.bmEmpty}>등록된 게시물이 없습니다.</p>
      ) : (
        <div className={styles.bmList}>
          {posts.map((p, index) => (
            <div key={p.id} className={styles.bmCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt="" className={styles.igThumb} />
              <div className={styles.bmCardInfo}>
                <div className={styles.bmCardNameRow}>
                  <span className={`${styles.bmStatusBadge} ${p.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {p.is_active ? '활성' : '비활성'}
                  </span>
                  <span className={styles.bmCardMeta}>
                    {p.caption || '캡션 없음'}{p.is_video ? ' · 영상' : ''}
                  </span>
                </div>
                <span className={styles.bmCardMeta}>{p.post_url}</span>
              </div>
              <div className={styles.bmCardActions}>
                <button onClick={() => handleMove(index, -1)} className={styles.refreshButton}
                  disabled={index === 0}>↑</button>
                <button onClick={() => handleMove(index, 1)} className={styles.refreshButton}
                  disabled={index === posts.length - 1}>↓</button>
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
