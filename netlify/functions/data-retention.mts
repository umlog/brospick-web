import type { Config } from '@netlify/functions';

// 매일 새벽 2시(KST = UTC 17:00 전날) 개인정보 보존 정책 자동 실행
export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl) {
    console.error('[data-retention] NEXT_PUBLIC_SITE_URL 환경변수가 설정되지 않았습니다.');
    return;
  }

  if (!cronSecret) {
    console.error('[data-retention] CRON_SECRET 환경변수가 설정되지 않았습니다.');
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/admin/data-retention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[data-retention] API 호출 실패 (${response.status}):`, body);
      return;
    }

    const result = await response.json();
    console.log(
      `[data-retention] 완료 - 마케팅 동의 초기화: ${result.marketing_cleared}건, PII 익명화: ${result.pii_anonymized}건, 실행 시각: ${result.ran_at}`
    );
  } catch (err) {
    console.error('[data-retention] 네트워크 오류:', err);
  }
}

export const config: Config = {
  // UTC 17:00 = KST 02:00
  schedule: '0 17 * * *',
};
