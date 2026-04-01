'use client';

import { useState, useEffect } from 'react';
import type { BlogPost } from '@/lib/domain/types';
import type { BlogFormData } from '../hooks/useBlogPosts';
import styles from '../admin.module.css';

interface BlogManagerProps {
  state: ReturnType<typeof import('../hooks/useBlogPosts').useBlogPosts>;
}

const EMPTY_FORM: BlogFormData = {
  player_name: '',
  team: '',
  position: '',
  status: '해외 진출',
  date: '',
  image: '',
  excerpt: '',
  content: '',
  highlights: [],
  video_url: null,
};

export function BlogManager({ state }: BlogManagerProps) {
  const { posts, loading, createPost, updatePost, deletePost } = state;

  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormData>(EMPTY_FORM);
  const [highlightsText, setHighlightsText] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setHighlightsText('');
    setShowForm(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      player_name: post.player_name,
      team: post.team,
      position: post.position,
      status: post.status,
      date: post.date,
      image: post.image,
      excerpt: post.excerpt,
      content: post.content,
      highlights: post.highlights,
      video_url: post.video_url,
    });
    setHighlightsText(post.highlights.join('\n'));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const highlights = highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const formData: BlogFormData = { ...form, highlights };

    let success = false;
    if (editingPost) {
      const result = await updatePost(editingPost.id, formData);
      success = result !== null;
    } else {
      const result = await createPost(formData);
      success = result !== null;
    }

    setSaving(false);
    if (success) closeForm();
  };

  const setField = <K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <p style={{ padding: '24px' }}>로딩 중...</p>;
  }

  if (showForm) {
    return (
      <div style={{ padding: '0 0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={closeForm} className={styles.refreshButton}>
            ← 목록으로
          </button>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {editingPost ? `"${editingPost.player_name}" 수정` : '새 블로그 포스트'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="선수 이름 *">
              <input
                className={styles.input}
                value={form.player_name}
                onChange={(e) => setField('player_name', e.target.value)}
                placeholder="김건오"
                required
              />
            </FormField>

            <FormField label="팀 *">
              <input
                className={styles.input}
                value={form.team}
                onChange={(e) => setField('team', e.target.value)}
                placeholder="Manningham FC (호주)"
                required
              />
            </FormField>

            <FormField label="포지션 *">
              <input
                className={styles.input}
                value={form.position}
                onChange={(e) => setField('position', e.target.value)}
                placeholder="MF, RW, LB"
                required
              />
            </FormField>

            <FormField label="상태 *">
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="해외 진출">해외 진출</option>
                <option value="프로 입단">프로 입단</option>
                <option value="대학 활동">대학 활동</option>
              </select>
            </FormField>

            <FormField label="날짜 *">
              <input
                className={styles.input}
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                placeholder="2026.01.12"
                required
              />
            </FormField>

            <FormField label="프로필 이미지 경로 *">
              <input
                className={styles.input}
                value={form.image}
                onChange={(e) => setField('image', e.target.value)}
                placeholder="/players/guno/guno-profile.jpg"
                required
              />
            </FormField>
          </div>

          <FormField label="요약 (excerpt) *">
            <textarea
              className={styles.input}
              value={form.excerpt}
              onChange={(e) => setField('excerpt', e.target.value)}
              rows={2}
              placeholder="블로그 목록에 표시될 짧은 설명"
              required
            />
          </FormField>

          <FormField label="주요 성과 (한 줄에 하나씩)">
            <textarea
              className={styles.input}
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              rows={4}
              placeholder={'청주대학교에서 후보 선수로 시작\n독립구단 거쳐 해외 진출 준비\n브로스픽과의 협업으로 호주 진출'}
            />
          </FormField>

          <FormField label="인스타그램 릴스 URL (선택)">
            <input
              className={styles.input}
              value={form.video_url ?? ''}
              onChange={(e) => setField('video_url', e.target.value || null)}
              placeholder="https://www.instagram.com/reel/..."
            />
          </FormField>

          <FormField label="본문 (마크다운) *">
            <textarea
              className={styles.input}
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              rows={30}
              placeholder={CONTENT_PLACEHOLDER}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
              required
            />
          </FormField>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>
              취소
            </button>
            <button
              type="submit"
              className={styles.refreshButton}
              disabled={saving}
              style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}
            >
              {saving ? '저장 중...' : editingPost ? '수정 저장' : '포스트 생성'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={openCreate} className={styles.refreshButton} style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}>
          + 새 포스트
        </button>
      </div>

      {posts.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          블로그 포스트가 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px' }}>{post.player_name}</strong>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {post.team} · {post.position}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#dbeafe',
                      color: '#1d4ed8',
                    }}
                  >
                    {post.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                  {post.date} · ID {post.id}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => openEdit(post)} className={styles.refreshButton}>
                  수정
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className={styles.refreshButton}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

const CONTENT_PLACEHOLDER = `# 선수이름의 이야기

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 이름 (Name) |
| 포지션 | LW, RB |
| 신장/체중 | 175cm / 70kg |
| 생년월일 | 2003년 1월 1일 |
| 국적 | 대한민국 |
| 현소속 | 팀명 |

> "인용구"

## 섹션 제목

본문 내용...

![img]/players/폴더/이미지.jpg

주요 강점:
- 스피드: 설명
- 드리블: 설명

## 커리어

| 기간 | 소속팀 |
|------|--------|
| 2020 | 팀 A |
| 2025 | 팀 B |

## 메시지

> "선수 메시지"`;
