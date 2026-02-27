// 상품 데이터 - 가격, 이미지, 사이즈 등을 한 곳에서 관리
// 새 상품 추가 시 products 객체에 항목만 추가하면 됩니다.

export interface SizeChartRow {
  size: string;
  length: number;  // 총장
  chest: number;   // 가슴단면
  sleeve: number;  // 소매길이
  hem: number;     // 밑단
}

export interface ProductFeature {
  label: string;
  detail?: string;
}

export interface ProductFunctionItem {
  title: string;
  description: string;
}

export interface ProductDetails {
  functions: ProductFunctionItem[];
  design: ProductFunctionItem[];
  material: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  tagline: string;
  description: string;
  sizes: string[];
  features: ProductFeature[];
  sizeChart: SizeChartRow[];
  details: ProductDetails;
}

export const products: Record<string, Product> = {
  '1': {
    id: 1,
    name: 'Half-Zip Training Top',
    price: 26900,
    originalPrice: 59000,
    image: '/apparel/bp-detail1.JPG',
    images: [
      '/apparel/bp-thumb.png',
      '/apparel/bp-thumb2.png',
      '/apparel/bp-detail1.JPG',
      '/apparel/bp-detailpoint.JPG',
      '/apparel/bp-light-second.png',
      '/apparel/bp-light-main.png',
    ],
    tagline: '가볍게 입고, 강하게 뛰는 브로스픽 반집업 트레이닝 탑',
    description:
      '편안한 착용감과 슬림한 실루엣을 동시에 잡은 Half-Zip Training Top. 고탄성 원단으로 몸을 안정감 있게 잡아주면서도 움직임은 자유롭고, 땀은 빠르게 건조되어 격한 운동에도 쾌적함을 유지해 줍니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    features: [
      { label: '편안한 착용감', detail: '과 슬림한 실루엣을 동시에' },
      { label: '고탄성 원단', detail: '으로 안정감 있는 핏' },
      { label: '자유로운 움직임', detail: ' — 어떤 운동에도 OK' },
      { label: '빠른 건조', detail: ' — 격한 운동에도 쾌적' },
    ],
    sizeChart: [
      { size: 'S', length: 61, chest: 45, sleeve: 67, hem: 45 },
      { size: 'M', length: 64, chest: 46, sleeve: 68, hem: 48 },
      { size: 'L', length: 67, chest: 51, sleeve: 74, hem: 50 },
      { size: 'XL', length: 70, chest: 53, sleeve: 76, hem: 53 },
      { size: '2XL', length: 73, chest: 55, sleeve: 78, hem: 55 },
    ],
    details: {
      functions: [
        { title: '핑거홀 디자인', description: '핑거홀 디자인으로 안정적인 착용감' },
        { title: '퀵드라이', description: '땀 흡수 후 빠른 건조' },
        { title: '4방향 스트레치', description: '러닝, 웨이트, 축구 모두 커버' },
        { title: '라이트웨이트', description: '가벼운 착용감, 레이어드에도 부담 없음' },
        { title: '통기성', description: '장시간 착용에도 쾌적' },
      ],
      design: [
        { title: '어깨 체크 패턴', description: '단색 상의에서도 포인트 연출' },
        { title: '하프 집업 넥', description: '체온 조절이 쉬운 반집업, 보온성 강화' },
        { title: '슬림 실루엣', description: '옆 라인을 따라 몸매를 정리해 주는 핏' },
        { title: '미니멀 로고', description: '전면 BR 로고, 후면 BROSPICK 레터링' },
        { title: '리플렉티브 디테일', description: '야간 러닝 시 안전성 향상, 조명 아래 하이라이트 연출' },
      ],
      material:
        '프리미엄 기능성 폴리에스터 + 스판 혼방. 부드러운 터치감과 높은 신축성, 세탁 시 수축과 뒤틀림을 최소화한 내구성.',
    },
  },
};

// 목록 페이지용 간략 상품 리스트
export const productList = Object.values(products).map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  originalPrice: p.originalPrice,
  image: p.images[0],
  description: p.tagline,
}));

// 할인율 계산 헬퍼
export function getDiscountPercent(price: number, originalPrice: number): number {
  return Math.round((1 - price / originalPrice) * 100);
}
