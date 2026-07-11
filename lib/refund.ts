// =============================================================================
// 반품 환불 금액 계산 - 서버(return.service)와 클라이언트(returns 페이지) 공용
// 계산 규칙이 두 곳에서 어긋나지 않도록 반드시 이 헬퍼만 사용할 것
// =============================================================================

import {
  RETURN_POLICY,
  REMOTE_AREA_SURCHARGE,
  SHIPPING,
  isRemoteArea,
  getShippingFee,
} from './constants';

export interface ReturnRefundInput {
  itemPrice: number;         // 반품 상품 단가 (정가)
  quantity: number;          // 반품 수량
  itemsSubtotal: number;     // 주문 전체 상품 금액 (정가 합)
  discountAmount: number;    // 주문에 적용된 쿠폰 할인 총액
  orderShippingFee: number;  // 주문 시 실제 결제한 배송비 (무료배송이면 0)
  postalCode?: string | null;
  priorReturnedGross?: number; // 같은 주문의 기존 반품(거절 제외) 상품 금액 합 (정가)
}

export interface ReturnRefundBreakdown {
  itemTotal: number;         // 반품 상품 정가 합
  couponDeduction: number;   // 쿠폰 할인 안분 차감액
  returnShippingFee: number; // 반품 배송비 (도서산간 할증 포함)
  shippingRecovered: number; // 무료배송 기준 미달로 회수하는 최초 배송비
  refundAmount: number;      // 최종 환불 금액 (0 미만 불가)
}

// 쿠폰 할인을 상품 금액 비율대로 안분
function prorateDiscount(gross: number, itemsSubtotal: number, discountAmount: number): number {
  if (discountAmount <= 0 || itemsSubtotal <= 0) return 0;
  return Math.min(gross, Math.round((discountAmount * gross) / itemsSubtotal));
}

export function computeReturnRefund(input: ReturnRefundInput): ReturnRefundBreakdown {
  const {
    itemPrice, quantity, itemsSubtotal, discountAmount,
    orderShippingFee, postalCode, priorReturnedGross = 0,
  } = input;

  const remote = !!postalCode && isRemoteArea(postalCode);
  const returnShippingFee = RETURN_POLICY.returnShippingFee + (remote ? REMOTE_AREA_SURCHARGE.return : 0);

  const itemTotal = itemPrice * quantity;
  const couponDeduction = prorateDiscount(itemTotal, itemsSubtotal, discountAmount);
  const returnedNet = itemTotal - couponDeduction;

  // 무료배송으로 받은 주문이 이번 반품으로 기준 아래로 떨어지는 경우에만
  // 최초 배송비를 회수 (기존 반품이 이미 기준을 깼으면 그쪽에서 회수 완료 → 이중 회수 방지)
  const priorNet = priorReturnedGross - prorateDiscount(priorReturnedGross, itemsSubtotal, discountAmount);
  const baseRemainingNet = Math.max(0, itemsSubtotal - discountAmount - priorNet);
  const remainingNet = Math.max(0, baseRemainingNet - returnedNet);
  const shippingRecovered =
    orderShippingFee === 0 &&
    baseRemainingNet >= SHIPPING.freeThreshold &&
    remainingNet < SHIPPING.freeThreshold
      ? getShippingFee(remainingNet, postalCode ?? undefined)
      : 0;

  const refundAmount = Math.max(0, returnedNet - returnShippingFee - shippingRecovered);

  return { itemTotal, couponDeduction, returnShippingFee, shippingRecovered, refundAmount };
}

export function computeExchangeFee(postalCode?: string | null): number {
  const remote = !!postalCode && isRemoteArea(postalCode);
  return RETURN_POLICY.exchangeShippingFee + (remote ? REMOTE_AREA_SURCHARGE.exchange : 0);
}
