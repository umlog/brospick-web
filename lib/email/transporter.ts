// =============================================================================
// Email Transporter - Nodemailer 공통 설정
// =============================================================================

import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// XSS 방지용 HTML 이스케이프
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 이메일 발송 공통 헬퍼
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: `"BROSPICK" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
