import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('Authorization');

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '권한 없음' }, { status: 401 });
  }

  const { status, detail } = await request.json();
  // 서버 알림만 받는 사람을 따로 둔다. ADMIN_EMAIL 은 주문 알림·어드민 로그인에도 쓰여서
  // 여기에 사람을 추가하려고 그 값을 바꾸면 다른 기능까지 영향을 받는다.
  // 형식: 쉼표로 구분한 주소 목록 (nodemailer 가 그대로 받는다)
  const adminEmail =
    process.env.HEALTH_ALERT_EMAILS || process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

  if (!adminEmail) {
    return NextResponse.json({ error: '관리자 이메일 미설정' }, { status: 500 });
  }

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const detailText = JSON.stringify(detail, null, 2);

  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
      <div style="background:#e53e3e;padding:20px 24px;">
        <h1 style="color:#fff;margin:0;font-size:18px;">🚨 BROSPICK 서버 이상 감지</h1>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none;">
        <p style="margin:0 0 12px;"><strong>감지 시각:</strong> ${now}</p>
        <p style="margin:0 0 12px;"><strong>HTTP 상태:</strong> ${status} (0 = 응답 없음·타임아웃, 약 8초 간격으로 연속 2회 실패)</p>
        <p style="margin:0 0 12px;"><strong>상세 내용:</strong></p>
        <pre style="background:#f7f7f7;padding:12px;border-radius:4px;font-size:13px;overflow:auto;">${detailText}</pre>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="margin:0;font-size:13px;color:#666;">
          Supabase 또는 서버 상태를 확인하세요.<br/>
          <a href="https://supabase.com/dashboard" style="color:#3182ce;">Supabase 대시보드</a> &nbsp;|&nbsp;
          <a href="https://app.netlify.com" style="color:#3182ce;">Netlify 대시보드</a>
        </p>
      </div>
    </div>
  `;

  await sendMail(adminEmail, `[BROSPICK] 서버 이상 감지 - ${now}`, html);

  return NextResponse.json({ ok: true });
}
