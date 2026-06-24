import { createClient } from '@supabase/supabase-js';

// 서버 전용 - layout.tsx SSR에서만 호출됨 (별도 함수 호출 없음)
async function fetchSiteSettings(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return {};

  const client = createClient(url, key);
  const { data } = await client.from('site_settings').select('key, value');
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
}

let cache: { settings: Record<string, string>; at: number } | null = null;
const TTL = 60_000; // 1분 캐시 (같은 서버 인스턴스 내)

export async function getSiteSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache.settings;
  const settings = await fetchSiteSettings();
  cache = { settings, at: now };
  return settings;
}
