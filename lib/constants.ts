// 사이트 전역 설정 - 한 곳에서 관리
// 가격, 배송비, 은행 정보 등을 변경할 때 이 파일만 수정하면 됩니다.

export const SHIPPING = {
  fee: 3500,
  freeThreshold: 100000, // 이 금액 이상 주문 시 무료배송
} as const;

export function getShippingFee(totalPrice: number): number {
  return totalPrice >= SHIPPING.freeThreshold ? 0 : SHIPPING.fee;
}

export const BANK = {
  name: '기업은행',
  account: '23714103902016',
  holder: '홍주영',
  notice: '주문 후 24시간 이내에 입금해주세요. 미입금 시 주문이 자동 취소됩니다.',
} as const;

export const CONTACT = {
  email: 'team.brospick@gmail.com',
  phone: '010-6604-6269',
} as const;

export const RETURN_POLICY = {
  windowDays: 7,
  returnShippingFee: 3500,   // 반품 배송비
  exchangeShippingFee: 7000, // 교환 배송비 (왕복)
  banks: ['카카오뱅크', '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협', '기업은행', 'SC제일은행', '토스뱅크', '케이뱅크'],
} as const;

export const CARE_INSTRUCTIONS = [
  '건조기 사용 금지',
  '온수세탁 금지',
] as const;

export const COMPANY = {
  name: 'BROSPICK',
  representative: '홍주영',
  businessNumber: '847-07-03351',
  communicationSalesNumber: '제 2026-경기파주-0883 호',
  address: '경기도 파주시 금정20길 19',
  privacyOfficer: '홍주영',
} as const;

export const SOCIAL_MEDIA = {
  instagram: 'https://www.instagram.com/team.brospick/',
  threads: 'https://www.threads.com/@team.brospick?',
} as const;

export const CARRIERS = ['CJ대한통운', '한진택배', '롯데택배', '로젠택배', '우체국택배'] as const;

export const TRACKING = {
  defaultCarrier: 'CJ대한통운',
  cjBaseUrl: 'https://trace.cjlogistics.com/next/tracking.html?wblNo=',
} as const;
