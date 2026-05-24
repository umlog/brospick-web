import type { Config } from '@netlify/functions';

// 5분마다 헬스체크 → 이상 감지 시 관리자 이메일 발송
export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error('[health-monitor] NEXT_PUBLIC_SITE_URL 또는 CRON_SECRET 환경변수가 없습니다.');
    return;
  }

  try {
    const res = await fetch(`${siteUrl}/api/health`);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[health-monitor] 헬스체크 실패 (${res.status}):`, body);

      // 관리자에게 알림 이메일 발송
      await fetch(`${siteUrl}/api/admin/health-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ status: res.status, detail: body }),
      });
    } else {
      console.log(`[health-monitor] 정상 (${new Date().toISOString()})`);
    }
  } catch (err) {
    console.error('[health-monitor] 네트워크 오류:', err);
  }
}

export const config: Config = {
  // 매 5분마다 실행
  schedule: '*/5 * * * *',
};
