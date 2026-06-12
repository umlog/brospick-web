'use client';

import { useState } from 'react';
import type { AdminProduct } from '@/lib/domain/types';
import { FinanceSummary } from './FinanceSummary';
import { FinanceExpenses } from './FinanceExpenses';
import { FinanceCosts } from './FinanceCosts';

interface Props {
  products: AdminProduct[];
}

type FinanceTab = 'summary' | 'expenses' | 'costs';

const TAB_LABELS: Record<FinanceTab, string> = {
  summary: '손익 요약',
  expenses: '지출 내역',
  costs: '원가 관리',
};

export function FinanceManager({ products }: Props) {
  const [tab, setTab] = useState<FinanceTab>('summary');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-sm)' }}>
        {(Object.keys(TAB_LABELS) as FinanceTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 'var(--size-sm)',
              fontWeight: tab === t ? 600 : 400,
              background: tab === t ? 'var(--color-accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {tab === 'summary' && <FinanceSummary />}
      {tab === 'expenses' && <FinanceExpenses />}
      {tab === 'costs' && <FinanceCosts products={products} />}
    </div>
  );
}
