// 사이트 전역 설정 - 한 곳에서 관리
// 가격, 배송비, 은행 정보 등을 변경할 때 이 파일만 수정하면 됩니다.

export const SHIPPING = {
  fee: 3500,
  freeShipping: true, // true면 배송비 할인 적용
} as const;

export const BANK = {
  name: '카카오뱅크',
  account: '3333-27-7618216',
  holder: '홍주영',
  notice: '주문 후 24시간 이내에 입금해주세요. 미입금 시 주문이 자동 취소됩니다.',
} as const;

export const CONTACT = {
  email: 'team.brospick@gmail.com',
} as const;
