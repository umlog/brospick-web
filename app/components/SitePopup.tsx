'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './SitePopup.module.css';
import { supabase } from '@/lib/supabase';

interface Popup {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  show_once: boolean;
}

export function SitePopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const now = new Date().toISOString();
        const { data } = await supabase
          .from('site_popups')
          .select('*')
          .eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(1);
        const d = data?.[0] as Popup | undefined;
        if (!d) return;
        if (d.show_once) {
          const key = `popup_dismissed_${d.id}`;
          if (sessionStorage.getItem(key)) return;
        }
        setPopup(d);
        setVisible(true);
      } catch {
        // ignore fetch errors
      }
    };
    fetchPopup();
  }, []);

  const close = () => setVisible(false);

  const dismissToday = () => {
    if (popup?.show_once) {
      sessionStorage.setItem(`popup_dismissed_${popup.id}`, '1');
    }
    close();
  };

  if (!visible || !popup) return null;

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="닫기">✕</button>

        {popup.image_url && (
          popup.link_url ? (
            <Link href={popup.link_url} onClick={close}>
              <img src={popup.image_url} alt={popup.title} className={styles.image} />
            </Link>
          ) : (
            <img src={popup.image_url} alt={popup.title} className={styles.image} />
          )
        )}

        <div className={styles.body}>
          <h3 className={styles.title}>{popup.title}</h3>
          <p className={styles.content}>{popup.content}</p>
          {popup.link_url && (
            <Link href={popup.link_url} className={styles.linkBtn} onClick={close}>
              자세히 보기
            </Link>
          )}
        </div>

        {popup.show_once && (
          <div className={styles.footer}>
            <button className={styles.dismissBtn} onClick={dismissToday}>
              오늘 하루 보지 않기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
