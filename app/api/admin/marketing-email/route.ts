import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { escapeHtml, sendMail } from '@/lib/email/transporter';

// 마케팅 동의 수신자 목록 조회
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_email, customer_name')
      .eq('marketing_consent', true)
      .not('customer_email', 'is', null);

    if (error) return apiError(`수신자 조회 실패: ${error.message}`, 500);

    // 이메일 중복 제거 (같은 고객이 여러 주문한 경우)
    const seen = new Set<string>();
    const recipients = (data ?? [])
      .filter(row => row.customer_email && !seen.has(row.customer_email) && seen.add(row.customer_email))
      .map(row => ({ email: row.customer_email as string, name: row.customer_name }));

    return NextResponse.json({ recipients, count: recipients.length });
  });
}

interface SendRequestBody {
  subject: string;
  body: string;
  emails?: string[];     // 배치 발송: 이번 요청에서 보낼 수신자 (전체를 쪼개서 전달)
  testEmail?: string;    // 테스트 발송: 이 주소 한 곳에만 발송
}

function buildEmailContent(subject: string, body: string) {
  const bodyHtml = escapeHtml(body)
    .split('\n\n')
    .map(para => `<p style="margin:0 0 16px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const html = `
<div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
  <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.1em;">BROSPICK</span>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#999;margin:0;">
      본 메일은 BROSPICK 마케팅 정보 수신에 동의하신 분께 발송되었습니다.<br>
      수신을 원치 않으시면 <a href="mailto:team.brospick@gmail.com?subject=마케팅%20수신거부" style="color:#999;">수신 거부</a>를 요청해 주세요.
    </p>
  </div>
</div>`;

  // HTML만 있으면 스팸 점수가 올라가므로 plain-text 버전 동봉
  const text = `${body}\n\n---\n본 메일은 BROSPICK 마케팅 정보 수신에 동의하신 분께 발송되었습니다.\n수신을 원치 않으시면 team.brospick@gmail.com 으로 수신 거부를 요청해 주세요.`;

  return { html, text };
}

// 마케팅 이메일 발송 (배치 단위 — 클라이언트가 수신자를 쪼개서 여러 번 호출)
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { subject, body, emails, testEmail } = await request.json() as SendRequestBody;
    if (!subject?.trim()) return apiError('제목을 입력해주세요.', 400);
    if (!body?.trim()) return apiError('내용을 입력해주세요.', 400);

    const { html, text } = buildEmailContent(subject, body);

    // 테스트 발송: 지정한 주소 한 곳에만 보내고 종료
    if (testEmail?.trim()) {
      try {
        await sendMail(testEmail.trim(), `[테스트] ${subject}`, html, text);
        return NextResponse.json({ sent: 1, failed: [], total: 1 });
      } catch {
        return NextResponse.json({ sent: 0, failed: [testEmail.trim()], total: 1 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .eq('marketing_consent', true)
      .not('customer_email', 'is', null);

    if (error) return apiError(`수신자 조회 실패: ${error.message}`, 500);

    const consented = new Set((data ?? []).map(row => row.customer_email as string));

    // 배치 목록이 오면 동의 여부를 서버에서 재검증, 없으면 전체 발송 (하위 호환)
    const targets = emails
      ? [...new Set(emails)].filter(email => consented.has(email))
      : [...consented];

    if (targets.length === 0) return apiError('수신자가 없습니다.', 400);

    const results = await Promise.allSettled(
      targets.map(email => sendMail(email, subject, html, text)),
    );

    const failed = targets.filter((_, i) => results[i].status === 'rejected');

    return NextResponse.json({
      sent: targets.length - failed.length,
      failed,
      total: targets.length,
    });
  });
}
