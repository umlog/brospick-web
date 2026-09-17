import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Supabase 응답 상태를 1분마다 기록하는 임시 측정 (2026-09-17 ~ 09-24, 7일)
//
// 목적: 간헐적인 504·525가 Supabase 무료(Nano) 서버의 한계 때문인지 판단해
// Pro 업그레이드 여부를 정한다. 사이트(/api/health)를 거치지 않고 Supabase를 직접 호출해
// Next.js 서버 쪽 지연과 섞이지 않게 했고, 기록은 Supabase 장애 중에도 남도록
// Netlify Blobs에 저장한다.
//
// - rest: PostgREST → DB 까지 가는 요청 (사이트가 실제로 쓰는 경로)
// - auth: 같은 입구를 지나지만 DB 조회가 없는 Auth 헬스 엔드포인트
//   둘 다 느리면 입구·네트워크 문제, rest만 느리면 DB·PostgREST 쪽 문제로 본다.
//
// 기록 키: KST 기준 시간 단위(예: 2026-09-17T21), 값은 그 시간의 측정 배열.
// 측정이 끝나면 이 파일을 지운다.

const PROBE_END_AT = Date.parse('2026-09-24T15:00:00Z'); // 2026-09-25 00:00 KST
const REQUEST_TIMEOUT_MS = 15_000;
const STORE_NAME = 'supabase-probe';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type ProbeResult = {
  status: number; // 0 = 응답 없음(타임아웃·네트워크 오류)
  ms: number;
  colo?: string; // cf-ray 끝의 Cloudflare 접속 지점 (예: IAD)
  error?: string;
};

type ProbeRecord = {
  at: string;
  rest: ProbeResult;
  auth: ProbeResult;
};

async function probe(url: string, apiKey: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    await res.arrayBuffer(); // 본문까지 받은 시간으로 잰다
    const colo = res.headers.get('cf-ray')?.split('-').pop();
    return { status: res.status, ms: Date.now() - startedAt, colo };
  } catch (err) {
    const error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return { status: 0, ms: Date.now() - startedAt, error };
  }
}

function kstHourKey(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 13);
}

export default async function handler() {
  const now = new Date();
  if (now.getTime() >= PROBE_END_AT) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error('[supabase-probe] NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 없습니다.');
    return;
  }

  const [rest, auth] = await Promise.all([
    probe(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, anonKey),
    probe(`${supabaseUrl}/auth/v1/health`, anonKey),
  ]);
  const record: ProbeRecord = { at: now.toISOString(), rest, auth };

  // 1분에 한 번만 돌기 때문에 같은 키를 동시에 고쳐 쓸 일은 사실상 없다
  const store = getStore(STORE_NAME);
  const key = kstHourKey(now);
  try {
    const records = ((await store.get(key, { type: 'json' })) as ProbeRecord[] | null) ?? [];
    records.push(record);
    await store.setJSON(key, records);
  } catch (err) {
    console.error('[supabase-probe] 기록 저장 실패:', { key, record, err });
  }
}

export const config: Config = {
  schedule: '* * * * *',
};
