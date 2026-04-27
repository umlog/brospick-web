'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface Recipient {
  email: string;
  name: string;
}

export function MarketingEmailManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[]; total: number } | null>(null);
  const [showRecipients, setShowRecipients] = useState(false);

  useEffect(() => {
    fetch('/api/admin/marketing-email')
      .then(r => r.json())
      .then(data => setRecipients(data.recipients ?? []))
      .finally(() => setLoadingRecipients(false));
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    const confirmed = window.confirm(
      `마케팅 동의 고객 ${recipients.length}명에게 이메일을 발송합니다.\n계속하시겠습니까?`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/marketing-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '발송 실패');
      setResult(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : '발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.marketingManager}>
      <div className={styles.marketingHeader}>
        <h3>마케팅 이메일 발송</h3>
        <button
          className={styles.recipientToggle}
          onClick={() => setShowRecipients(v => !v)}
        >
          {loadingRecipients
            ? '수신자 로딩 중...'
            : `수신자 ${recipients.length}명 ${showRecipients ? '숨기기' : '보기'}`}
        </button>
      </div>

      {showRecipients && (
        <div className={styles.recipientList}>
          {recipients.length === 0 ? (
            <p className={styles.emptyText}>마케팅 동의 고객이 없습니다.</p>
          ) : (
            recipients.map(r => (
              <span key={r.email} className={styles.recipientChip}>
                {r.name} ({r.email})
              </span>
            ))
          )}
        </div>
      )}

      <div className={styles.emailForm}>
        <div className={styles.emailFormGroup}>
          <label>제목</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="이메일 제목을 입력하세요"
            disabled={sending}
          />
        </div>
        <div className={styles.emailFormGroup}>
          <label>내용</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={'안녕하세요, BROSPICK입니다.\n\n빈 줄로 단락을 구분하면 이메일에서 문단으로 표시됩니다.'}
            rows={12}
            disabled={sending}
          />
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim() || recipients.length === 0}
        >
          {sending ? '발송 중...' : `${recipients.length}명에게 발송`}
        </button>
      </div>

      {result && (
        <div className={result.failed.length > 0 ? styles.resultWarning : styles.resultSuccess}>
          <strong>발송 완료</strong> — {result.sent}/{result.total}명 성공
          {result.failed.length > 0 && (
            <p>실패: {result.failed.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
