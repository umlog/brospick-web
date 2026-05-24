'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();

  return (
    <main style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
    }}>
      <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
      <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
        일시적인 오류가 발생했습니다
      </h1>
      <p style={{ fontSize: '15px', color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
        잠시 후 다시 시도해주세요.<br />
        문제가 계속되면 고객센터로 문의해주세요.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          홈으로
        </button>
      </div>
    </main>
  );
}
