'use client';

import { useEffect } from 'react';

// 스플래시 활성화 여부를 클라이언트에서 확인하고 비활성화 시 즉시 제거.
// 설정값은 localStorage에 5분 캐시 → API 호출 최소화.
export function SplashController() {
  useEffect(() => {
    const CACHE_KEY = 'splash_cfg';
    const TTL = 5 * 60 * 1000;

    // React 19: 노드를 제거하면 fiber 트리와 어긋나 네비게이션 시 크래시.
    // 제거 대신 숨김 처리해 body 자식 노드를 유지한다.
    const remove = () => {
      const el = document.getElementById('__splash');
      if (el) el.style.display = 'none';
    };

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { enabled, at } = JSON.parse(cached) as { enabled: boolean; at: number };
      if (Date.now() - at < TTL) {
        if (!enabled) remove();
        return;
      }
    }

    fetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((d: Record<string, string>) => {
        const enabled = d.splash_screen_enabled !== 'false';
        localStorage.setItem(CACHE_KEY, JSON.stringify({ enabled, at: Date.now() }));
        if (!enabled) remove();
      })
      .catch(() => {});
  }, []);

  return null;
}
