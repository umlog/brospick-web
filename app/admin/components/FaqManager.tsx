'use client';

import { useState } from 'react';
import type { Faq } from '../hooks/useFaqs';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

interface Props {
  state: ReturnType<typeof import('../hooks/useFaqs').useFaqs>;
}

const FAQ_CATEGORIES = ['일반', '배송', '교환/반품', '상품', '결제'];

const EMPTY = { question: '', answer: '', category: '일반' };

export function FaqManager({ state }: Props) {
  const { faqs, loading, createFaq, updateFaq, deleteFaq } = state;
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (f: Faq) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) await updateFaq(editing.id, form);
    else await createFaq(form);
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (f: Faq) => {
    const ok = await showConfirm(`"${f.question.slice(0, 30)}..." FAQ를 삭제할까요?`);
    if (ok) deleteFaq(f.id);
  };

  const handleToggle = (f: Faq) => updateFaq(f.id, { is_active: !f.is_active });

  const filtered = filterCat ? faqs.filter((f) => f.category === filterCat) : faqs;

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  if (showForm) {
    return (
      <div className={styles.bmFormWrapper}>
        <div className={styles.bmFormHeader}>
          <button onClick={closeForm} className={styles.refreshButton}>← 목록으로</button>
          <h2 className={styles.bmFormTitle}>{editing ? 'FAQ 수정' : '새 FAQ'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.bmForm}>
          <div className={styles.bmFormGrid}>
            <div className={styles.bmField}>
              <label className={styles.bmFieldLabel}>카테고리 *</label>
              <select className={styles.input} value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>질문 *</label>
            <input className={styles.input} value={form.question}
              onChange={(e) => set('question', e.target.value)} required placeholder="배송은 얼마나 걸리나요?" />
          </div>
          <div className={styles.bmField}>
            <label className={styles.bmFieldLabel}>답변 *</label>
            <textarea className={styles.input} value={form.answer} rows={5} required
              onChange={(e) => set('answer', e.target.value)} placeholder="주문 후 2-3 영업일 내 발송됩니다." />
          </div>
          <div className={styles.bmFormActions}>
            <button type="button" onClick={closeForm} className={styles.refreshButton}>취소</button>
            <button type="submit" className={`${styles.refreshButton} ${styles.bmPrimaryBtn}`} disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정 저장' : 'FAQ 추가'}
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
          + FAQ 추가
        </button>
      </div>

      <div className={styles.filters}>
        <button className={`${styles.filterButton} ${!filterCat ? styles.filterActive : ''}`}
          onClick={() => setFilterCat('')}>전체 ({faqs.length})</button>
        {FAQ_CATEGORIES.map((c) => {
          const cnt = faqs.filter((f) => f.category === c).length;
          if (cnt === 0) return null;
          return (
            <button key={c}
              className={`${styles.filterButton} ${filterCat === c ? styles.filterActive : ''}`}
              onClick={() => setFilterCat(filterCat === c ? '' : c)}>
              {c} ({cnt})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.bmEmpty}>FAQ가 없습니다.</p>
      ) : (
        <div className={styles.faqList}>
          {filtered.map((f) => (
            <div key={f.id} className={`${styles.faqItem} ${!f.is_active ? styles.faqInactive : ''}`}>
              <div className={styles.faqHeader}
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}>
                <span className={styles.faqCategory}>{f.category}</span>
                <span className={styles.faqQuestion}>{f.question}</span>
                <span className={styles.faqChevron}>{expandedId === f.id ? '▲' : '▼'}</span>
              </div>
              {expandedId === f.id && (
                <div className={styles.faqAnswer}>{f.answer}</div>
              )}
              <div className={styles.faqActions}>
                <button onClick={() => handleToggle(f)}
                  className={`${styles.refreshButton} ${f.is_active ? '' : styles.bmPrimaryBtn}`}
                  style={{ fontSize: '0.75rem' }}>
                  {f.is_active ? '숨기기' : '표시'}
                </button>
                <button onClick={() => openEdit(f)} className={styles.refreshButton}>수정</button>
                <button onClick={() => handleDelete(f)} className={`${styles.refreshButton} ${styles.bmDeleteBtn}`}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
