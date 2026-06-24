'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SiteBannerData } from '@/lib/site-content';

interface Props {
  initialBanner: SiteBannerData | null;
}

export function SiteBanner({ initialBanner }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const banner = initialBanner;

  if (!banner || dismissed) return null;

  const content = (
    <span style={{ color: banner.text_color }}>{banner.message}</span>
  );

  return (
    <div
      style={{
        backgroundColor: banner.bg_color,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '0.85rem',
        fontWeight: 500,
        position: 'relative',
      }}
    >
      {banner.link_url ? (
        <Link href={banner.link_url} style={{ textDecoration: 'none' }}>
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: banner.text_color,
          opacity: 0.6,
          fontSize: '1rem',
          padding: '0 4px',
          position: 'absolute',
          right: '12px',
        }}
        aria-label="배너 닫기"
      >
        ✕
      </button>
    </div>
  );
}
