'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error.digest ?? error.message);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <span className={styles.ghost} aria-hidden="true">OOPS</span>
      <div className={styles.content}>
        <p className={styles.code}>SOMETHING WENT WRONG</p>
        <h1 className={styles.title}>일시적인 오류가 발생했어요</h1>
        <p className={styles.desc}>
          잠시 후 다시 시도해주세요.
          <br />
          문제가 계속되면 고객센터로 문의해주세요.
        </p>
        <div className={styles.actions}>
          <button onClick={reset} className="btn btn-primary">다시 시도</button>
          <Link href="/" className="btn btn-outline"><span>홈으로</span></Link>
        </div>
      </div>
    </main>
  );
}
