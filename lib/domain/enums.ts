// =============================================================================
// Domain Enums - 모든 상태값의 단일 진실 공급원
// 기존에 여러 파일에 magic string으로 분산되어 있던 값들을 통일
// =============================================================================

// 주문 상태
export enum OrderStatus {
  PENDING_PAYMENT = '입금대기',
  PAYMENT_CONFIRMED = '입금확인',
  SHIPPING = '배송중',
  DELIVERED = '배송완료',
}

// 발송 지연 상태는 동적 문자열 패턴 (예: "2주 뒤 발송")
export const DELAY_STATUS_REGEX = /^(\d+)주 뒤 발송$/;

export function isDelayStatus(status: string): boolean {
  return DELAY_STATUS_REGEX.test(status);
}

export function makeDelayStatus(weeks: number): string {
  return `${weeks}주 뒤 발송`;
}

// 재고 조정이 필요한 "확정" 상태인지 확인
export function isConfirmedStatus(status: string): boolean {
  return status === OrderStatus.PAYMENT_CONFIRMED || isDelayStatus(status);
}

// 주문 삭제 시 재고 복원이 필요한 상태 목록
export const STOCK_RESTORE_STATUSES = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
] as const;

// 반품/교환 상태
export enum ReturnStatus {
  RECEIVED = '접수완료',
  APPROVED = '승인',
  COLLECTING = '수거중',
  COLLECTED = '수거완료',
  COMPLETED = '처리완료',
  REJECTED = '거절',
}

// 상품 사이즈 재고 상태
export enum SizeStatus {
  AVAILABLE = 'available',
  SOLD_OUT = 'sold_out',
  DELAYED = 'delayed',
}

// 반품/교환 구분
export enum ReturnType {
  EXCHANGE = '교환',
  RETURN = '반품',
}
