import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 공개 클라이언트 (anon key - RLS 적용됨)
let supabase: SupabaseClient;

const fetchNoCache: typeof fetch = (url, options) =>
  fetch(url, { ...options, cache: 'no-store' });

if (supabaseUrl && supabaseUrl.startsWith('http')) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: fetchNoCache } });
} else {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder');
}

// 서버 전용 클라이언트 (service_role key - RLS 우회)
// API Route에서만 사용. 절대 클라이언트에 노출하지 말 것.
let supabaseAdmin: SupabaseClient;

if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, { global: { fetch: fetchNoCache } });
} else {
  if (supabaseUrl && supabaseUrl.startsWith('http') && !supabaseServiceRoleKey) {
    console.error(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. ' +
      'supabaseAdmin이 anon 클라이언트로 폴백됩니다 — 어드민 작업이 조용히 실패할 수 있습니다.'
    );
  }
  supabaseAdmin = supabase;
}

export { supabase, supabaseAdmin };
