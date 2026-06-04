import type { Config } from '@netlify/functions';

// 매일 오전 10시(KST = UTC 01:00) 배송완료 3일 후 리뷰 요청 메일 발송
export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl) {
    console.error('[review-reminder] NEXT_PUBLIC_SITE_URL 환경변수가 설정되지 않았습니다.');
    return;
  }

  if (!cronSecret) {
    console.error('[review-reminder] CRON_SECRET 환경변수가 설정되지 않았습니다.');
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/cron/review-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[review-reminder] API 호출 실패 (${response.status}):`, body);
      return;
    }

    const result = await response.json();
    console.log(`[review-reminder] 완료 - 발송: ${result.sent}건, 실패: ${result.failed}건`);
  } catch (err) {
    console.error('[review-reminder] 네트워크 오류:', err);
  }
}

export const config: Config = {
  // UTC 01:00 = KST 10:00
  schedule: '0 1 * * *',
};
