'use client';

import { useEffect } from 'react';

export default function VisitTracker() {
  useEffect(() => {
    // 세션당 1회만 기록
    if (sessionStorage.getItem('visit_tracked')) return;
    sessionStorage.setItem('visit_tracked', '1');
    fetch('/api/visits', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}
