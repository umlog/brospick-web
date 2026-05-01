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

// 마케팅 이메일 발송
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { subject, body } = await request.json() as { subject: string; body: string };
    if (!subject?.trim()) return apiError('제목을 입력해주세요.', 400);
    if (!body?.trim()) return apiError('내용을 입력해주세요.', 400);

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .eq('marketing_consent', true)
      .not('customer_email', 'is', null);

    if (error) return apiError(`수신자 조회 실패: ${error.message}`, 500);

    const emails = [...new Set((data ?? []).map(row => row.customer_email as string))];
    if (emails.length === 0) return apiError('수신자가 없습니다.', 400);

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
      본 메일은 BROSPICK 마케팅 정보 수신에 동의하신 분께 발송되었습니다.
    </p>
  </div>
</div>`;

    let sent = 0;
    const failed: string[] = [];

    for (const email of emails) {
      try {
        await sendMail(email, subject, html);
        sent++;
      } catch {
        failed.push(email);
      }
    }

    return NextResponse.json({ sent, failed, total: emails.length });
  });
}
