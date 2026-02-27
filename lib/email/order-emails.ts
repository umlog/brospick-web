// =============================================================================
// Order Emails - 주문 관련 이메일 템플릿
// sendOrderConfirmationEmail, sendNewOrderNotificationEmail
// =============================================================================

import { escapeHtml, sendMail } from './transporter';
import { BANK } from '@/lib/constants';
import type { OrderEmailData } from '@/lib/domain/types';

function buildItemsHtml(items: OrderEmailData['items']): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${escapeHtml(item.productName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${escapeHtml(item.size)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">₩${(item.price * item.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');
}

// 고객 주문 확인 이메일
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemsHtml = buildItemsHtml(data.items);

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">주문이 완료되었습니다</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        ${escapeHtml(data.customerName)}님, 주문해주셔서 감사합니다.
      </p>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
      </div>

      <h3 style="font-size:14px;color:#333;margin:0 0 12px;font-weight:600;">주문 상품</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:left;font-weight:500;">상품</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">사이즈</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">수량</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:right;font-weight:500;">금액</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="border-top:2px solid #333;padding-top:12px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">상품 금액</span>
          <span style="font-size:14px;color:#333;">₩${(data.totalAmount - data.shippingFee).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">배송비</span>
          <span style="font-size:14px;color:#333;">₩${data.shippingFee.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:15px;color:#333;font-weight:700;">총 결제금액</span>
          <span style="font-size:15px;color:#ff3b30;font-weight:700;">₩${data.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#e65100;margin:0 0 10px;">입금 안내 (무통장입금)</h4>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">은행명: <strong>${BANK.name}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">계좌번호: <strong>${BANK.account}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">예금주: <strong>${BANK.holder}</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">입금자명: <strong>${escapeHtml(data.depositorName)}</strong></p>
        <p style="font-size:12px;color:#e65100;margin:12px 0 0;font-weight:500;">⚠ 주문 후 24시간 이내에 입금해주세요.</p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#333;margin:0 0 8px;">배송지</h4>
        <p style="font-size:13px;color:#555;margin:0;">
          ${escapeHtml(data.address)}${data.addressDetail ? ' ' + escapeHtml(data.addressDetail) : ''}
        </p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          주문 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 주문 확인 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.customerEmail, `[BROSPICK] 주문이 완료되었습니다 (${data.orderNumber})`, html);
}

// 관리자 새 주문 알림 이메일
export async function sendNewOrderNotificationEmail(data: OrderEmailData) {
  const itemsHtml = buildItemsHtml(data.items);

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#ffcc00;font-size:14px;margin:0;font-weight:600;">새 주문이 들어왔습니다!</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">고객명</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.customerName)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">입금자명</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.depositorName)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">배송지</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.address)}${data.addressDetail ? ' ' + escapeHtml(data.addressDetail) : ''}</span>
        </div>
      </div>

      <h3 style="font-size:14px;color:#333;margin:0 0 12px;font-weight:600;">주문 상품</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:left;font-weight:500;">상품</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">사이즈</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">수량</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:right;font-weight:500;">금액</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="border-top:2px solid #333;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">상품 금액</span>
          <span style="font-size:14px;color:#333;">₩${(data.totalAmount - data.shippingFee).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">배송비</span>
          <span style="font-size:14px;color:#333;">₩${data.shippingFee.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:15px;color:#333;font-weight:700;">총 결제금액</span>
          <span style="font-size:15px;color:#ff3b30;font-weight:700;">₩${data.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">BROSPICK 관리자 알림</p>
    </div>
  </div>`;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;
  await sendMail(adminEmail, `[새 주문] ${data.customerName}님 - ₩${data.totalAmount.toLocaleString()} (${data.orderNumber})`, html);
}
