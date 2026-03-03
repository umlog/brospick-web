'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

interface VisitData {
  today: number;
  recent: { date: string; count: number }[];
}

export function VisitCounter() {
  const [data, setData] = useState<VisitData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/visits')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className={styles.visitCounter}>
      <button
        className={styles.visitBadge}
        onClick={() => setExpanded((v) => !v)}
        title="오늘 방문 수"
      >
        👁 {data.today.toLocaleString()}
      </button>

      {expanded && (
        <div className={styles.visitPopover}>
          <p className={styles.visitPopoverTitle}>최근 7일 방문</p>
          {data.recent.length === 0 ? (
            <p className={styles.visitPopoverEmpty}>데이터 없음</p>
          ) : (
            data.recent.map((row) => (
              <div key={row.date} className={styles.visitRow}>
                <span>{row.date}</span>
                <span>{row.count.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
