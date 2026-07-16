'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

interface Recipient {
  email: string;
  name: string;
}

interface SendResult {
  sent: number;
  failed: string[];
  total: number;
}

// Gmail 버스트 발송 감지 회피: 소량 배치 + 배치 간 딜레이
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 2500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function MarketingEmailManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [showRecipients, setShowRecipients] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    request<{ recipients: Recipient[] }>('/api/admin/marketing-email')
      .then(data => setRecipients(data.recipients ?? []))
      .catch(() => showToast('수신자 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setLoadingRecipients(false));
  }, []);

  const canWrite = subject.trim().length > 0 && body.trim().length > 0;

  const handleTestSend = async () => {
    if (!canWrite || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      const data = await request<SendResult>('/api/admin/marketing-email', {
        method: 'POST',
        body: { subject, body, testEmail: testEmail.trim() },
      });
      if (data.sent === 1) {
        showToast(`테스트 메일을 ${testEmail.trim()}(으)로 발송했습니다. 수신함과 스팸함을 확인하세요.`, 'success');
      } else {
        showToast('테스트 발송에 실패했습니다.', 'error');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '테스트 발송 중 오류가 발생했습니다.', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSend = async () => {
    if (!canWrite || recipients.length === 0) return;
    const ok = await showConfirm(
      `마케팅 동의 고객 ${recipients.length}명에게 이메일을 발송합니다.\n` +
      `${BATCH_SIZE}명씩 나눠 발송하며 수 분이 걸릴 수 있습니다. 발송 중 창을 닫지 마세요.\n계속하시겠습니까?`
    );
    if (!ok) return;

    setSending(true);
    setResult(null);

    const emails = recipients.map(r => r.email);
    let sent = 0;
    const failed: string[] = [];

    setProgress({ done: 0, total: emails.length });

    try {
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        try {
          const data = await request<SendResult>('/api/admin/marketing-email', {
            method: 'POST',
            body: { subject, body, emails: batch },
          });
          sent += data.sent;
          failed.push(...data.failed);
        } catch {
          // 배치 전체 실패 (타임아웃 등) — 해당 배치 수신자를 실패 목록에 기록
          failed.push(...batch);
        }
        setProgress({ done: Math.min(i + BATCH_SIZE, emails.length), total: emails.length });

        if (i + BATCH_SIZE < emails.length) {
          await delay(BATCH_DELAY_MS);
        }
      }
      setResult({ sent, failed, total: emails.length });
    } finally {
      setSending(false);
      setProgress(null);
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
            placeholder="(광고) 이메일 제목 — 광고성 메일은 (광고) 표기가 법적 의무입니다"
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

        <div className={styles.testSendRow}>
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="테스트 수신 주소 (본발송 전 확인용)"
            disabled={sending || sendingTest}
          />
          <button
            className={styles.recipientToggle}
            onClick={handleTestSend}
            disabled={sending || sendingTest || !canWrite || !testEmail.trim()}
          >
            {sendingTest ? '테스트 발송 중...' : '테스트 발송'}
          </button>
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || !canWrite || recipients.length === 0}
        >
          {sending && progress
            ? `발송 중... ${progress.done}/${progress.total}`
            : `${recipients.length}명에게 발송`}
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
