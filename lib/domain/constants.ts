// =============================================================================
// Domain Constants - 상태 관련 상수 및 state machine
// app/admin/constants.ts 에서 통합
// =============================================================================

import { OrderStatus, ReturnStatus } from './enums';

// 어드민 필터 드롭다운용 (모든 상태 포함)
export const ORDER_STATUS_OPTIONS = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  '발송지연', // 필터용 레이블 - 실제 값은 "N주 뒤 발송" 동적 문자열
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCEL_REQUESTED,
  OrderStatus.CANCELLED,
] as const;

// 어드민 상태 변경 버튼용 (취소 관련 상태 제외 - 별도 UI로 처리)
export const ORDER_STATUS_BUTTON_OPTIONS = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  '발송지연',
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
] as const;

// UI 드롭다운용 반품 상태 목록
export const RETURN_STATUS_OPTIONS = [
  ReturnStatus.RECEIVED,
  ReturnStatus.APPROVED,
  ReturnStatus.COLLECTING,
  ReturnStatus.COLLECTED,
  ReturnStatus.COMPLETED,
  ReturnStatus.REJECTED,
] as const;

// 반품 상태 전환 state machine
export const RETURN_STATUS_TRANSITIONS: Record<string, ReturnStatus[]> = {
  [ReturnStatus.RECEIVED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  [ReturnStatus.APPROVED]: [ReturnStatus.COLLECTING],
  [ReturnStatus.COLLECTING]: [ReturnStatus.COLLECTED],
  [ReturnStatus.COLLECTED]: [ReturnStatus.COMPLETED],
};

// API 유효성 검사용 주문 상태 목록 (발송지연 제외 - 별도 regex 처리)
export const VALID_ORDER_STATUSES = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCEL_REQUESTED,
  OrderStatus.CANCELLED,
] as const;

// 고객이 취소 신청 가능한 상태
export const CANCELLABLE_STATUSES = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPING,
] as const;
