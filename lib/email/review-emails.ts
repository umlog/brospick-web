// =============================================================================
// Review Emails - 리뷰 요청 이메일 템플릿
// =============================================================================

import { escapeHtml, sendMail } from './transporter';

interface ReviewReminderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
}

export async function sendReviewReminderEmail(data: ReviewReminderEmailData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brospick.com';
  const reviewUrl = `${siteUrl}/review?orderNumber=${encodeURIComponent(data.orderNumber)}`;

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">구매하신 상품은 어떠셨나요?</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">${escapeHtml(data.customerName)}님, 안녕하세요.</p>

      <div style="background:#f0faf3;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">⭐</div>
        <p style="font-size:16px;color:#1a1a1a;font-weight:700;margin:0 0 8px;">상품 후기를 남겨주세요!</p>
        <p style="font-size:14px;color:#555;margin:0;line-height:1.6;">
          소중한 리뷰는 다른 고객분들께 큰 도움이 됩니다.<br>
          솔직한 후기를 남겨주시면 감사합니다.
        </p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${reviewUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
          리뷰 작성하기
        </a>
        <p style="font-size:12px;color:#aaa;margin:16px 0 0;">리뷰 작성에는 주문 시 입력하신 전화번호가 필요합니다.</p>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 마케팅 수신에 동의하신 고객님께 발송된 리뷰 요청 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(
    data.customerEmail,
    `[BROSPICK] ${escapeHtml(data.customerName)}님, 구매하신 상품 후기를 남겨주세요`,
    html,
  );
}
