// =============================================================================
// Ebook Emails - 전자책 주문 관련 이메일 템플릿
// =============================================================================

import { escapeHtml, sendMail } from './transporter';
import { BANK, CONTACT } from '@/lib/constants';

export interface EbookOrderData {
  name: string;
  phone: string;
  email: string;
  orderNumber: string;
  amount: number;
}

// 고객 주문 접수 확인 이메일
export async function sendEbookOrderConfirmation(data: EbookOrderData): Promise<void> {
  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#ff3b30;font-size:14px;margin:0;font-weight:600;">전자책 주문이 접수되었습니다</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        ${escapeHtml(data.name)}님, 주문해주셔서 감사합니다.<br>
        아래 계좌로 입금해주시면 확인 후 다운로드 링크를 이메일로 보내드립니다.
      </p>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">결제금액</span>
          <span style="font-size:15px;color:#ff3b30;font-weight:700;">₩${data.amount.toLocaleString()}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#e65100;margin:0 0 14px;font-weight:700;">무통장 입금 안내</h4>
        <p style="font-size:13px;color:#555;margin:0 0 6px;">은행명: <strong>${BANK.name}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 6px;">계좌번호: <strong>${BANK.account}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 6px;">예금주: <strong>${BANK.holder}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 6px;">입금자명: <strong>${escapeHtml(data.name)}</strong></p>
        <p style="font-size:12px;color:#e65100;margin:14px 0 0;font-weight:600;">⚠ 주문 후 24시간 이내 입금해주세요. 미입금 시 주문이 취소될 수 있습니다.</p>
      </div>

      <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#333;margin:0 0 10px;font-weight:600;">다음 단계</h4>
        <ol style="font-size:13px;color:#555;margin:0;padding-left:20px;line-height:2.2;">
          <li>위 계좌로 입금해주세요.</li>
          <li>브로스픽 팀이 입금을 확인합니다.</li>
          <li>확인 후 이 이메일(${escapeHtml(data.email)})로 다운로드 링크를 보내드립니다.</li>
        </ol>
      </div>

      <p style="font-size:12px;color:#999;margin:0;">
        문의사항이 있으시면 언제든지 연락해주세요.<br>
        이메일: <a href="mailto:${CONTACT.email}" style="color:#ff3b30;">${CONTACT.email}</a>
        &nbsp;·&nbsp;
        전화: ${CONTACT.phone}
      </p>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 주문 확인 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.email, `[BROSPICK] 전자책 주문이 접수되었습니다 (${data.orderNumber})`, html);
}

// 다운로드 링크 발송 이메일
export async function sendEbookDownloadLink(data: {
  name: string;
  email: string;
  orderNumber: string;
  downloadUrl: string;
  expiresAt: string; // ISO string
}): Promise<void> {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#34c759;font-size:14px;margin:0;font-weight:600;">전자책 다운로드 링크가 준비되었습니다</p>
    </div>

    <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 24px;">
        ${escapeHtml(data.name)}님, 입금이 확인되었습니다.<br>
        아래 버튼을 눌러 전자책을 다운로드하세요.
      </p>

      <div style="text-align:center;margin:0 0 28px;">
        <a href="${data.downloadUrl}"
           style="display:inline-block;padding:16px 40px;background:#ff3b30;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
          전자책 다운로드
        </a>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:13px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">링크 만료일</span>
          <span style="font-size:13px;color:#333;font-weight:600;">${expiryDate}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:14px;margin-bottom:24px;">
        <p style="font-size:12px;color:#e65100;margin:0;line-height:1.7;">
          ⚠ 이 링크는 최대 <strong>5회</strong>까지 다운로드 가능하며 <strong>${expiryDate}</strong>에 만료됩니다.<br>
          만료 전 반드시 다운로드하여 저장해두세요.
        </p>
      </div>

      <p style="font-size:12px;color:#999;margin:0;">
        문의사항: <a href="mailto:${CONTACT.email}" style="color:#ff3b30;">${CONTACT.email}</a>
        &nbsp;·&nbsp; ${CONTACT.phone}
      </p>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 자동 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.email, `[BROSPICK] 전자책 다운로드 링크 (${data.orderNumber})`, html);
}

// 관리자 새 주문 알림 이메일
export async function sendEbookOrderNotification(data: EbookOrderData): Promise<void> {
  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#ffcc00;font-size:14px;margin:0;font-weight:600;">새 전자책 주문이 들어왔습니다!</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">이름</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.name)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">연락처</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.phone)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">이메일</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.email)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #eee;">
          <span style="font-size:14px;color:#333;font-weight:600;">결제금액</span>
          <span style="font-size:16px;color:#ff3b30;font-weight:700;">₩${data.amount.toLocaleString()}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:14px;">
        <p style="font-size:13px;color:#e65100;margin:0;font-weight:600;">
          입금 확인 후 고객 이메일(${escapeHtml(data.email)})로 다운로드 링크를 발송해주세요.
        </p>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">BROSPICK 관리자 알림 · 전자책 주문</p>
    </div>
  </div>`;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;
  await sendMail(
    adminEmail,
    `[전자책 주문] ${data.name}님 — ₩${data.amount.toLocaleString()} (${data.orderNumber})`,
    html,
  );
}
