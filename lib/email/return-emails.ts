// =============================================================================
// Return Emails - 반품/교환 관련 이메일 템플릿
// sendReturnRequestEmail, sendReturnStatusEmail
// =============================================================================

import { escapeHtml, sendMail } from './transporter';
import { RETURN_POLICY } from '@/lib/constants';
import type { ReturnRequestEmailData, ReturnStatusEmailData } from '@/lib/domain/types';
import { ReturnStatus, ReturnType } from '@/lib/domain/enums';

const RETURN_STATUS_INFO: Partial<Record<ReturnStatus, { title: string; message: string; color: string; bgColor: string }>> = {
  [ReturnStatus.APPROVED]: { title: '교환/반품이 승인되었습니다', message: '요청이 승인되어 처리가 진행됩니다.', color: '#34c759', bgColor: '#f0faf3' },
  [ReturnStatus.COLLECTING]: { title: '반품 수거가 시작되었습니다', message: '상품 수거가 진행 중입니다.', color: '#5856d6', bgColor: '#f3f0ff' },
  [ReturnStatus.COLLECTED]: { title: '상품 수거가 완료되었습니다', message: '수거된 상품을 확인 중입니다.', color: '#007aff', bgColor: '#f0f6ff' },
  [ReturnStatus.COMPLETED]: { title: '교환/반품 처리가 완료되었습니다', message: '모든 처리가 완료되었습니다. 이용해주셔서 감사합니다.', color: '#34c759', bgColor: '#f0faf3' },
  [ReturnStatus.REJECTED]: { title: '교환/반품 요청이 거절되었습니다', message: '요청이 거절되었습니다.', color: '#ff3b30', bgColor: '#fff0f0' },
};

// 반품/교환 접수 이메일
export async function sendReturnRequestEmail(data: ReturnRequestEmailData) {
  const typeLabel = data.type === '교환' ? '교환 (사이즈 변경)' : '반품 (환불)';
  const shippingFee = data.type === '교환' ? RETURN_POLICY.exchangeShippingFee : RETURN_POLICY.returnShippingFee;
  const detailHtml = data.type === '교환' && data.exchangeSize
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:13px;color:#888;">사이즈 변경</span>
        <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.currentSize)} → ${escapeHtml(data.exchangeSize)}</span>
      </div>`
    : '';

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">${data.type} 신청이 접수되었습니다</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        ${escapeHtml(data.customerName)}님, ${data.type} 신청이 정상적으로 접수되었습니다.
      </p>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">접수번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.requestNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.orderNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">유형</span>
          <span style="font-size:14px;color:#333;">${typeLabel}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">상품</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.productName)} (${escapeHtml(data.currentSize)})</span>
        </div>
        ${detailHtml}
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">사유</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.reason)}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#e65100;margin:0 0 8px;font-weight:600;">${data.type} 배송비 안내</p>
        <p style="font-size:13px;color:#e65100;margin:0;">
          ${data.type} 배송비 ₩${shippingFee.toLocaleString()}은 고객 부담입니다.${data.type === '반품' ? ' 환불 금액에서 차감됩니다.' : ''}
        </p>
        <p style="font-size:12px;color:#888;margin:8px 0 0;">
          접수된 요청은 확인 후 순차적으로 처리됩니다. 처리 상태는 주문 조회에서 확인하실 수 있습니다.
        </p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          처리 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 ${data.type} 접수 안내 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.customerEmail, `[BROSPICK] ${data.type} 신청이 접수되었습니다 (${data.requestNumber})`, html);
}

// 반품/교환 상태 변경 이메일
export async function sendReturnStatusEmail(data: ReturnStatusEmailData) {
  const info = RETURN_STATUS_INFO[data.status as ReturnStatus];
  if (!info) return;

  const title = info.title.replace('교환/반품', data.type as string);

  let extraHtml = '';
  if (data.status === ReturnStatus.REJECTED && data.rejectReason) {
    extraHtml = `
      <div style="background:#fff0f0;border:1px solid #ffcdd2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#c62828;margin:0 0 8px;">거절 사유</h4>
        <p style="font-size:13px;color:#555;margin:0;">${escapeHtml(data.rejectReason)}</p>
      </div>`;
  }
  if (data.status === ReturnStatus.COLLECTING && data.returnTrackingNumber) {
    extraHtml = `
      <div style="background:#f0f6ff;border:1px solid #d0e3ff;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">반품 운송장번호</span>
          <span style="font-size:15px;color:#333;font-weight:700;font-family:monospace;">${escapeHtml(data.returnTrackingNumber)}</span>
        </div>
      </div>`;
  }
  if (data.status === ReturnStatus.COMPLETED && data.type === ReturnType.RETURN && data.refundAmount) {
    extraHtml = `
      <div style="background:#f0faf3;border:1px solid #c8e6c9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">환불 금액</span>
          <span style="font-size:15px;color:#2e7d32;font-weight:700;">₩${data.refundAmount.toLocaleString()}</span>
        </div>
      </div>`;
  }

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">${title}</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">${escapeHtml(data.customerName)}님, 안녕하세요.</p>

      <div style="background:${info.bgColor};border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${info.color};color:#fff;font-size:14px;font-weight:600;margin-bottom:12px;">
          ${escapeHtml(data.status)}
        </div>
        <p style="font-size:14px;color:#333;margin:12px 0 0;">${info.message}</p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">접수번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${escapeHtml(data.requestNumber)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;">${escapeHtml(data.orderNumber)}</span>
        </div>
      </div>

      ${extraHtml}

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          처리 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">본 메일은 BROSPICK에서 발송된 ${data.type} 상태 알림 메일입니다.</p>
    </div>
  </div>`;

  await sendMail(data.customerEmail, `[BROSPICK] ${title} (${data.requestNumber})`, html);
}
