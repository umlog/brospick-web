// 사이트 전역 설정 - 한 곳에서 관리
// 가격, 배송비, 은행 정보 등을 변경할 때 이 파일만 수정하면 됩니다.

export const SHIPPING = {
  fee: 3000,
  freeThreshold: 100000, // 이 금액 이상 주문 시 무료배송
} as const;

// CJ대한통운 기준 도서산간 지역 추가 요금
export const REMOTE_AREA_SURCHARGE = {
  shipping: 3000,    // 배송비 추가
  return: 3000,      // 반품 추가
  exchange: 5000,   // 교환 추가
} as const;

// CJ대한통운 도서산간 지역 우편번호 범위 [시작, 끝]
const REMOTE_AREA_RANGES: [number, number][] = [
  [22386, 22388], // 인천 중구 섬지역
  [23004, 23010], // 인천 강화군 섬지역
  [23100, 23116], // 인천 옹진군 섬지역
  [23124, 23136], // 인천 옹진군 섬지역
  [31708, 31708], // 충남 당진시 섬지역
  [32133, 32133], // 충남 태안군 섬지역
  [33411, 33411], // 충남 보령시 섬지역
  [40200, 40240], // 경북 울릉군 (울릉도·독도)
  [46768, 46771], // 부산 강서구 섬지역
  [52570, 52571], // 경남 사천시 섬지역
  [53031, 53033], // 경남 통영시 섬지역
  [53089, 53104], // 경남 통영시 섬지역
  [54000, 54000], // 경남 통영시 섬지역
  [56347, 56349], // 전북 부안군 섬지역
  [57068, 57069], // 전남 영광군 섬지역
  [58760, 58762], // 전남 목포시 섬지역
  [58800, 58810], // 전남 신안군 섬지역
  [58816, 58818], // 전남 신안군 섬지역
  [58826, 58826], // 전남 신안군 섬지역
  [58828, 58866], // 전남 신안군 섬지역
  [58953, 58958], // 전남 진도군 섬지역
  [59102, 59103], // 전남 완도군 섬지역
  [59106, 59106], // 전남 완도군 섬지역
  [59127, 59127], // 전남 완도군 섬지역
  [59129, 59129], // 전남 완도군 섬지역
  [59137, 59166], // 전남 완도군 섬지역
  [59421, 59421], // 전남 보성군 섬지역
  [59531, 59531], // 전남 고흥군 섬지역
  [59551, 59551], // 전남 고흥군 섬지역
  [59563, 59563], // 전남 고흥군 섬지역
  [59568, 59568], // 전남 고흥군 섬지역
  [59650, 59650], // 전남 여수시 섬지역
  [59766, 59766], // 전남 여수시 섬지역
  [59781, 59790], // 전남 여수시 섬지역
  [63000, 63644], // 제주특별자치도 전지역
];

export function isRemoteArea(postalCode: string): boolean {
  const code = parseInt(postalCode, 10);
  if (isNaN(code)) return false;
  return REMOTE_AREA_RANGES.some(([start, end]) => code >= start && code <= end);
}

export function getShippingFee(totalPrice: number, postalCode?: string): number {
  if (totalPrice >= SHIPPING.freeThreshold) return 0;
  const surcharge = postalCode && isRemoteArea(postalCode) ? REMOTE_AREA_SURCHARGE.shipping : 0;
  return SHIPPING.fee + surcharge;
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
