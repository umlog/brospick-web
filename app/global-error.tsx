'use client';

import { useEffect } from 'react';

// 루트 레이아웃까지 깨졌을 때 렌더되는 최후의 화면.
// globals.css/폰트가 적용되지 않으므로 다크 브랜드 톤을 인라인으로 모두 담는다.
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
      <body style={{ margin: 0, background: '#121212' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
            background: '#121212',
            color: '#f5f5f5',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(120px, 28vw, 300px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              opacity: 0.04,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            BROSPICK
          </span>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3em', color: '#ff3b30', margin: '0 0 16px' }}>
              SERVICE UNAVAILABLE
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: '#f5f5f5' }}>
              서비스 점검 중입니다
            </h1>
            <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 28px', lineHeight: 1.7, maxWidth: '360px' }}>
              더 나은 서비스를 위해 잠시 점검 중입니다.
              <br />
              불편을 드려 죄송합니다. 잠시 후 다시 접속해주세요.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 32px',
                background: '#ff3b30',
                color: '#fff',
                border: '1px solid #ff3b30',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <p style={{ marginTop: '28px', fontSize: '13px', color: '#777' }}>
              문의: team.brospick@gmail.com
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
