'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>
        <main style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
          background: '#fff',
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
            서비스 점검 중입니다
          </h1>
          <p style={{ fontSize: '15px', color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
            더 나은 서비스를 위해 잠시 점검 중입니다.<br />
            불편을 드려 죄송합니다. 잠시 후 다시 접속해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px',
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
          <p style={{ marginTop: '32px', fontSize: '13px', color: '#999' }}>
            문의: team.brospick@gmail.com
          </p>
        </main>
      </body>
    </html>
  );
}
