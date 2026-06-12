'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Banner {
  id: number;
  message: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
}

export function SiteBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from('site_banners')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setBanner(data[0] as Banner);
      })
      .catch(() => {});
  }, []);

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
