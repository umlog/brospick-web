// =============================================================================
// Return Emails - 반품/교환 관련 이메일 템플릿
// sendReturnRequestEmail, sendReturnStatusEmail
// =============================================================================

import { escapeHtml, sendMail } from './transporter';
import { RETURN_POLICY, BANK } from '@/lib/constants';
import type { ReturnRequestEmailData, ReturnStatusEmailData } from '@/lib/domain/types';
import { ReturnStatus, ReturnType } from '@/lib/domain/enums';

// 교환/반품 불가 사유 (신청 페이지와 동일하게 유지)
const RETURN_INELIGIBLE_REASONS = [
  '상품 수령 후 7일이 지난 경우',
  '착용·세탁·수선 등 사용 흔적이 있는 경우',
  '상품 택(라벨) 제거 또는 포장이 훼손된 경우',
  '고객 부주의로 상품이 오염·훼손된 경우',
  '향수·화장품·체취 등 냄새가 밴 경우',
] as const;

const ineligibleListHtml = `
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#555;margin:0 0 8px;font-weight:600;">교환/반품이 불가한 경우</p>
        <ul style="font-size:12px;color:#888;margin:0;padding-left:18px;line-height:1.8;">
          ${RETURN_INELIGIBLE_REASONS.map((r) => `<li>${r}</li>`).join('\n          ')}
        </ul>
        <p style="font-size:12px;color:#888;margin:8px 0 0;">위 사유에 해당하는 경우 요청이 거절되고 상품이 반송될 수 있습니다.</p>
      </div>`;

const RETURN_STATUS_INFO: Partial<Record<ReturnStatus, { title: string; message: string; color: string; bgColor: string }>> = {
  [ReturnStatus.APPROVED]: { title: '교환/반품이 승인되었습니다', message: '요청이 승인되었습니다. 1~2일 이내 상품 수거가 시작됩니다.', color: '#34c759', bgColor: '#f0faf3' },
  [ReturnStatus.COLLECTING]: { title: '반품 수거가 시작되었습니다', message: '상품 수거가 진행 중입니다.', color: '#5856d6', bgColor: '#f3f0ff' },
  [ReturnStatus.COLLECTED]: { title: '상품 수거가 완료되었습니다', message: '수거된 상품을 확인 중입니다.', color: '#007aff', bgColor: '#f0f6ff' },
  [ReturnStatus.COMPLETED]: { title: '교환/반품 처리가 완료되었습니다', message: '모든 처리가 완료되었습니다. 이용해주셔서 감사합니다.', color: '#34c759', bgColor: '#f0faf3' },
  [ReturnStatus.REJECTED]: { title: '교환/반품 요청이 거절되었습니다', message: '요청이 거절되었습니다.', color: '#c22833', bgColor: '#fff0f0' },
};

// 반품/교환 접수 이메일
export async function sendReturnRequestEmail(data: ReturnRequestEmailData) {
  const typeLabel = data.type === '교환' ? '교환 (사이즈 변경)' : '반품 (환불)';
  const shippingFee = data.shippingFee
    ?? (data.type === '교환' ? RETURN_POLICY.exchangeShippingFee : RETURN_POLICY.returnShippingFee);
  const isKakaoPay = data.paymentMethod === '카카오페이';
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

      ${data.type === '교환' ? `
      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#e65100;margin:0 0 8px;font-weight:600;">교환 배송비 입금 안내</p>
        <p style="font-size:13px;color:#e65100;margin:0 0 12px;">
          교환 배송비 <strong>₩${shippingFee.toLocaleString()}</strong>(왕복)은 고객 부담입니다. 아래 계좌로 입금해주세요.
        </p>
        <div style="background:#fff;border:1px solid #ffe0b2;border-radius:6px;padding:12px 16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">입금 계좌</span>
            <span style="font-size:14px;color:#333;font-weight:700;font-family:monospace;">${BANK.name} ${BANK.account}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">예금주</span>
            <span style="font-size:14px;color:#333;">${BANK.holder}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#888;">입금 금액</span>
            <span style="font-size:14px;color:#c22833;font-weight:700;">₩${shippingFee.toLocaleString()}</span>
          </div>
        </div>
        <p style="font-size:12px;color:#888;margin:0;line-height:1.7;">
          · 입금자명은 주문자명(${escapeHtml(data.customerName)})으로 입금해주세요.<br/>
          · 입금 확인 후 <strong>1~2일 이내</strong> 상품 수거가 시작됩니다.<br/>
          · 입금이 확인되지 않으면 교환 처리가 보류됩니다.
        </p>
      </div>` : `
      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#e65100;margin:0 0 8px;font-weight:600;">반품 배송비 및 환불 안내</p>
        <p style="font-size:13px;color:#e65100;margin:0;">
          반품 배송비 ₩${shippingFee.toLocaleString()}은 환불 금액에서 차감되므로 <strong>별도 입금이 필요하지 않습니다.</strong>
        </p>
        ${data.refundAmount !== undefined ? `
        <div style="background:#fff;border:1px solid #ffe0b2;border-radius:6px;padding:12px 16px;margin-top:12px;">
          ${data.itemTotal !== undefined ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">상품 금액</span>
            <span style="font-size:14px;color:#333;">₩${data.itemTotal.toLocaleString()}</span>
          </div>` : ''}
          ${data.couponDeduction ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">쿠폰 할인 차감</span>
            <span style="font-size:14px;color:#333;">-₩${data.couponDeduction.toLocaleString()}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">반품 배송비</span>
            <span style="font-size:14px;color:#333;">-₩${shippingFee.toLocaleString()}</span>
          </div>
          ${data.shippingRecovered ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#888;">최초 배송비 (무료배송 기준 미달)</span>
            <span style="font-size:14px;color:#333;">-₩${data.shippingRecovered.toLocaleString()}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;border-top:1px solid #eee;padding-top:8px;">
            <span style="font-size:13px;color:#888;">환불 예정 금액</span>
            <span style="font-size:14px;color:#c22833;font-weight:700;">₩${data.refundAmount.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#888;">환불 방법</span>
            <span style="font-size:14px;color:#333;">${isKakaoPay ? '카카오페이 자동 환불' : '입력하신 계좌로 이체 (처리완료 후 1~3영업일)'}</span>
          </div>
        </div>
        ${data.refundAmount === 0 ? `
        <p style="font-size:12px;color:#c22833;margin:8px 0 0;">
          차감 금액이 상품 금액 이상이어서 환불 예정 금액이 없습니다. 문의사항은 고객센터로 연락해주세요.
        </p>` : ''}` : ''}
        <p style="font-size:12px;color:#888;margin:12px 0 0;">
          승인 후 1~2일 이내 상품 수거가 시작됩니다. 수거된 상품 검수 후 환불이 진행됩니다.
        </p>
      </div>`}

      ${ineligibleListHtml}

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}" style="display:inline-block;background:#c22833;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
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
    const isKakaoPay = data.paymentMethod === '카카오페이';
    extraHtml = `
      <div style="background:#f0faf3;border:1px solid #c8e6c9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">환불 금액</span>
          <span style="font-size:15px;color:#2e7d32;font-weight:700;">₩${data.refundAmount.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">환불 방법</span>
          <span style="font-size:14px;color:#333;">${isKakaoPay ? '카카오페이 자동 환불 (즉시)' : '입력하신 계좌로 이체 (1~3영업일)'}</span>
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
        <a href="${data.trackingUrl}" style="display:inline-block;background:#c22833;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
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
