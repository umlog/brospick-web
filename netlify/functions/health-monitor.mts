import type { Config } from '@netlify/functions';

// 5분마다 헬스체크 → 이상 감지 시 관리자 이메일 발송
//
// 한 번 실패로는 알리지 않는다. Supabase 무료(Nano) 서버는 몇 초씩 멈췄다 돌아오는
// 일이 잦아서, 단발 실패마다 메일을 보내면 진짜 장애와 구분이 안 된다.
// 잠시 뒤 한 번 더 확인해 연속으로 실패했을 때만 알린다.
// 스케줄 함수는 30초 안에 끝나야 하므로 대기·타임아웃을 그 안에 맞췄다.

const FETCH_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 8_000;

type HealthResult = { ok: true } | { ok: false; status: number; detail: unknown };

async function checkHealth(siteUrl: string): Promise<HealthResult> {
  try {
    const res = await fetch(`${siteUrl}/api/health`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) return { ok: true };

    const detail = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, detail };
  } catch (err) {
    // 타임아웃·네트워크 오류도 사이트가 응답하지 않는 상태이므로 실패로 센다
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, detail: { error: message } };
  }
}

export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error('[health-monitor] NEXT_PUBLIC_SITE_URL 또는 CRON_SECRET 환경변수가 없습니다.');
    return;
  }

  const first = await checkHealth(siteUrl);
  if (first.ok) {
    console.log(`[health-monitor] 정상 (${new Date().toISOString()})`);
    return;
  }

  console.warn(`[health-monitor] 1차 실패 (${first.status}), ${RETRY_DELAY_MS}ms 뒤 재확인:`, first.detail);
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

  const second = await checkHealth(siteUrl);
  if (second.ok) {
    console.log('[health-monitor] 재확인 정상 — 일시적 실패로 보고 알리지 않음');
    return;
  }

  console.error(`[health-monitor] 연속 실패 (${first.status} → ${second.status}):`, second.detail);

  try {
    const alertRes = await fetch(`${siteUrl}/api/admin/health-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        status: second.status,
        detail: { first: first.detail, second: second.detail },
      }),
    });
    if (!alertRes.ok) {
      console.error(`[health-monitor] 알림 발송 요청 실패 (${alertRes.status})`);
    }
  } catch (err) {
    console.error('[health-monitor] 알림 발송 요청 네트워크 오류:', err);
  }
}

export const config: Config = {
  // 매 5분마다 실행
  schedule: '*/5 * * * *',
};
