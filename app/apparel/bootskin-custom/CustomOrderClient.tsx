'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './custom-order.module.css';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function CustomOrderClient() {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/custom-order', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('server error');
      setState('success');
    } catch {
      setState('error');
      setErrorMsg('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  if (state === 'success') {
    return (
      <main className={styles.main}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>메일이 전송되었습니다</h2>
          <p className={styles.successDesc}>
            주문 문의가 접수되었습니다.<br />
            인스타그램 DM으로 추가 안내를 드릴 예정입니다.
          </p>
          <a
            href="https://ig.me/m/team.brospick"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dmButton}
          >
            인스타그램 DM으로 이동
          </a>
          <Link href="/apparel" className={styles.backLink}>← 쇼핑 계속하기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>CUSTOM ORDER</p>
          <h1 className={styles.title}>BOOT SKIN 커스텀</h1>
          <p className={styles.subtitle}>나만의 디자인을 부츠에 새기세요.</p>
        </div>

        {/* Info badges */}
        <div className={styles.infoBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>최소 수량</span>
            <span className={styles.badgeValue}>10세트</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>기본 사이즈</span>
            <span className={styles.badgeValue}>0.8cm × 1cm</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>결제</span>
            <span className={styles.badgeValue}>상담 후 별도 안내</span>
          </div>
        </div>

        {/* Notice */}
        <div className={styles.notice}>
          <p>인쇄 과정에서 새롭게 판을 제작해야 하기 때문에 <strong>최소 주문 수량은 10세트</strong>입니다.</p>
          <p>같은 디자인으로 재주문 시에는 추후 1세트씩 낱개 구매도 가능합니다.</p>
          <p>사이즈는 기본 가로 0.8cm × 세로 1cm로 제작되며, 별도 요청 주시면 적용 가능합니다.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              디자인 설명 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              placeholder="원하시는 디자인을 자세히 설명해 주세요. (예: 팀 이름, 번호, 로고 스타일, 색상 등)"
              rows={5}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="image">
              참고 이미지 <span className={styles.optional}>(선택)</span>
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className={styles.fileInput}
            />
            <p className={styles.fieldHint}>JPG, PNG, WEBP — 최대 5MB</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="quantity">
              수량 <span className={styles.required}>*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={10}
              defaultValue={10}
              className={styles.numberInput}
              required
            />
            <p className={styles.fieldHint}>최소 10세트부터 주문 가능합니다.</p>
          </div>

          {state === 'error' && <p className={styles.errorMsg}>{errorMsg}</p>}

          <button type="submit" className={styles.submitButton} disabled={state === 'loading'}>
            {state === 'loading' ? '전송 중...' : '주문 문의하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
