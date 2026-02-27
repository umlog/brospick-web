// =============================================================================
// Domain Constants - 상태 관련 상수 및 state machine
// app/admin/constants.ts 에서 통합
// =============================================================================

import { OrderStatus, ReturnStatus } from './enums';

// UI 드롭다운용 주문 상태 목록 (표시 순서 유지)
export const ORDER_STATUS_OPTIONS = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  '발송지연', // 필터용 레이블 - 실제 값은 "N주 뒤 발송" 동적 문자열
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
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
] as const;
