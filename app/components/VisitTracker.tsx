'use client';

import { useEffect } from 'react';
import { trackInternal, detectTrafficSource } from '../../lib/analytics';

export default function VisitTracker() {
  useEffect(() => {
    // 세션당 1회만 기록
    if (sessionStorage.getItem('visit_tracked')) return;
    sessionStorage.setItem('visit_tracked', '1');
    fetch('/api/visits', { method: 'POST' }).catch(() => {});
    // 유입 소스 포함 방문 이벤트 (어드민 대시보드 유입경로 집계용)
    trackInternal('visit', detectTrafficSource());
  }, []);

  return null;
}
