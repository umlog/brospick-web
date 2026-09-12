/**
 * 주문번호 마스킹.
 *
 * 주문번호는 배송조회(/api/orders/track)에서 전화번호와 함께 본인 확인 토큰처럼 쓰인다.
 * 리뷰 작성 목록은 이름+전화번호만으로 열리므로, 그 목록에 진짜 주문번호를 실어 보내면
 * 이름과 번호를 아는 사람이 배송조회까지 열 수 있다. 목록에는 가린 값만 내보낸다.
 *
 * 날짜 자리는 남긴다 — 손님이 여러 주문 중에 어느 것인지 알아보려면 그 단서가 필요하다.
 * 예) BP-20250209-1234 → BP-20250209-****
 *
 * 서버와 화면이 같이 쓰므로 DB 의존이 없는 별도 모듈에 둔다.
 */
export function maskOrderNumber(orderNumber: string): string {
  if (!orderNumber) return '';

  const segments = orderNumber.split('-');

  // 구분자가 없는 형식은 뒤 4자리만 가린다
  if (segments.length < 2) {
    if (orderNumber.length <= 4) return '*'.repeat(orderNumber.length);
    return orderNumber.slice(0, -4) + '****';
  }

  const last = segments[segments.length - 1];
  return [...segments.slice(0, -1), '*'.repeat(last.length)].join('-');
}
