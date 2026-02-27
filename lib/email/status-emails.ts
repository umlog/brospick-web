// =============================================================================
// Status Emails - 주문 상태 관련 이메일 템플릿
// sendStatusChangeEmail, sendPaymentReminderEmail
// =============================================================================

import { escapeHtml, sendMail } from './transporter';
import { BANK, TRACKING } from '@/lib/constants';
import type { StatusChangeEmailData, PaymentReminderEmailData } from '@/lib/domain/types';
import { OrderStatus } from '@/lib/domain/enums';

const STATUS_INFO: Partial<Record<OrderStatus, { title: string; message: string; color: string; bgColor: string }>> = {
  [OrderStatus.PAYMENT_CONFIRMED]: {
    title: '입금이 확인되었습니다',
    message: '입금이 정상적으로 확인되었습니다. 빠르게 배송 준비를 시작하겠습니다.',
    color: '#34c759',
    bgColor: '#f0faf3',
  },
  [OrderStatus.SHIPPING]: {
    title: '상품이 배송 중입니다',
    message: '주문하신 상품이 발송되었습니다. 곧 받아보실 수 있습니다.',
    color: '#5856d6',
    bgColor: '#f3f0ff',
  },
  [OrderStatus.DELIVERED]: {
    title: '배송이 완료되었습니다',
    message: '상품이 정상적으로 배송 완료되었습니다. BROSPICK을 이용해주셔서 감사합니다.',
    color: '#34c759',
    bgColor: '#f0faf3',
  },
};

export async function sendStatusChangeEmail(data: StatusChangeEmailData) {
  const info = STATUS_INFO[data.status as OrderStatus];
  if (!info) return;

  const copyButtonStyle = `display:inline-block;margin-left:8px;padding:2px 8px;background:#eee;border-radius:4px;font-size:11px;color:#555;text-decoration:none;cursor:pointer;vertical-align:middle;`;
  const cjTrackingUrl = data.trackingNumber
    ? `${TRACKING.cjBaseUrl}${encodeURIComponent(data.trackingNumber)}`
    : '';

  const trackingNumberHtml = data.trackingNumber ? `
      <div style="background:#f0f6ff;border:1px solid #d0e3ff;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">택배사</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${TRACKING.defaultCarrier}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">운송장번호</span>
          <span>
            <span style="font-size:15px;color:#333;font-weight:700;font-family:monospace;letter-spacing:0.5px;">${escapeHtml(data.trackingNumber)}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${escapeHtml(data.trackingNumber)}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span>
            <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${escapeHtml(data.orderNumber)}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
        <div style="text-align:center;margin-top:14px;">
          <a href="${cjTrackingUrl}" style="display:inline-block;background:#003876;color:#fff;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">
            ${TRACKING.defaultCarrier} 배송 조회
          </a>
        </div>
      </div>` : `
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span>
            <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${escapeHtml(data.orderNumber)}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
      </div>`;

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">${info.title}</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">${escapeHtml(data.customerName)}님, 안녕하세요.</p>

      <div style="background:${info.bgColor};border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${info.color};color:#fff;font-size:14px;font-weight:600;margin-bottom:12px;">
          ${escapeHtml(data.status)}
        </div>
        <p style="font-size:14px;color:#333;margin:12px 0 0;">${info.message}</p>
      </div>

      ${trackingNumberHtml}

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          주문 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 주문 상태 알림 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.customerEmail, `[BROSPICK] ${info.title} (${data.orderNumber})`, html);
}

export async function sendPaymentReminderEmail(data: PaymentReminderEmailData) {
  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">입금 안내드립니다</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">${escapeHtml(data.customerName)}님, 안녕하세요.</p>

      <div style="background:#f0faf3;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="font-size:15px;color:#333;margin:0;font-weight:600;">주문이 확인되었습니다.</p>
        <p style="font-size:14px;color:#555;margin:8px 0 0;">입금이 확인되면 바로 배송이 시작됩니다.</p>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#e65100;margin:0 0 12px;">입금 안내</h4>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">은행명</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${BANK.name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">계좌번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${BANK.account}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">예금주</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${BANK.holder}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:13px;color:#888;">결제금액</span>
          <span style="font-size:15px;color:#ff3b30;font-weight:700;">₩${data.totalAmount.toLocaleString()}</span>
        </div>
        <p style="font-size:12px;color:#e65100;margin:0;font-weight:500;">⚠ 주문 후 24시간 이내에 입금해주세요.</p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.orderNumber)}</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          주문 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 입금 안내 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.customerEmail, `[BROSPICK] 입금 안내드립니다 (${data.orderNumber})`, html);
}
