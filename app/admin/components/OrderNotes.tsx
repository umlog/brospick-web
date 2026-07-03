'use client';

import { useEffect, useState } from 'react';
import { request } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import styles from '../admin.module.css';

interface Note {
  id: number;
  note: string;
  created_at: string;
}

interface Props {
  orderId: string;
}

export function OrderNotes({ orderId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    request<Note[]>(`/api/admin/order-notes?order_id=${encodeURIComponent(orderId)}`)
      .then((d) => setNotes(Array.isArray(d) ? d : []))
      .catch(() => showToast('메모를 불러오지 못했습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setAdding(true);
    try {
      const data = await request<Note>('/api/admin/order-notes', {
        method: 'POST',
        body: { order_id: orderId, note: input.trim() },
      });
      setNotes((prev) => [...prev, data]);
      setInput('');
    } catch {
      showToast('메모 추가에 실패했습니다.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request('/api/admin/order-notes', { method: 'DELETE', body: { id } });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      showToast('메모 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div className={styles.notesSection}>
      <p className={styles.notesSectionTitle}>내부 메모</p>

      {loading ? (
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>로딩 중...</p>
      ) : notes.length > 0 ? (
        <div className={styles.notesList}>
          {notes.map((n) => (
            <div key={n.id} className={styles.noteItem}>
              <span style={{ flex: 1 }}>{n.note}</span>
              <span className={styles.noteTime}>
                {new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button className={styles.noteDeleteBtn} onClick={() => handleDelete(n.id)}>✕</button>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.noteInputRow}>
        <input
          className={styles.noteInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메모 추가..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          disabled={adding}
        />
        <button className={styles.noteAddBtn} onClick={handleAdd} disabled={adding || !input.trim()}>
          {adding ? '...' : '추가'}
        </button>
      </div>
    </div>
  );
}
