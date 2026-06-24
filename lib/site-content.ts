import { supabase } from '@/lib/supabase';

// 서버 컴포넌트(layout)에서 ISR로 한 번만 조회해 클라이언트에 props로 내려준다.
// 쿼리에 now 타임스탬프를 넣지 않아야 fetch 캐시(URL 기준)가 동작하므로,
// is_active만 쿼리하고 시간창(starts_at/ends_at)은 JS에서 필터한다.

export interface SiteBannerData {
  id: number;
  message: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
}

export interface SitePopupData {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  show_once: boolean;
}

interface TimeWindow {
  starts_at: string | null;
  ends_at: string | null;
}

function withinWindow(row: TimeWindow, now: number): boolean {
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
  return true;
}

export async function getActiveBanner(): Promise<SiteBannerData | null> {
  const { data } = await supabase
    .from('site_banners')
    .select('id, message, link_url, bg_color, text_color, starts_at, ends_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const now = Date.now();
  const row = (data ?? []).find((b) => withinWindow(b as TimeWindow, now));
  if (!row) return null;
  const { starts_at: _s, ends_at: _e, ...banner } = row as SiteBannerData & TimeWindow;
  return banner;
}

export async function getActivePopup(): Promise<SitePopupData | null> {
  const { data } = await supabase
    .from('site_popups')
    .select('id, title, content, image_url, link_url, show_once, starts_at, ends_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const now = Date.now();
  const row = (data ?? []).find((p) => withinWindow(p as TimeWindow, now));
  if (!row) return null;
  const { starts_at: _s, ends_at: _e, ...popup } = row as SitePopupData & TimeWindow;
  return popup;
}
