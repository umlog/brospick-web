// 상품 데이터 - 가격, 이미지, 사이즈 등을 한 곳에서 관리
//
// 새 상품 추가 체크리스트:
//   1. PRODUCT_SLUGS 에 항목 추가
//   2. PRODUCT_IDS 에 항목 추가
//   3. products 객체에 데이터 추가
//   4. public/apparel/[slug]/ 폴더 만들고 이미지 넣기
//   5. Supabase product_sizes 테이블에 새 product_id 행 추가

// URL + 코드 식별자 (오타 방지용 타입 안전 상수)
export const PRODUCT_SLUGS = {
  HALF_ZIP_TRAINING_TOP: 'half-zip-training-top',
  QUARTER_ZIP_TRAINING_TOP_BLACK: 'quarter-zip-training-top-black',
  QUARTER_ZIP_TRAINING_TOP_GRAY: 'quarter-zip-training-top-gray',
} as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[keyof typeof PRODUCT_SLUGS];

// DB FK (Supabase product_sizes.product_id) 숫자 ID 중앙화
export const PRODUCT_IDS = {
  HALF_ZIP_TRAINING_TOP: 1,
  QUARTER_ZIP_TRAINING_TOP_BLACK: 2,
  QUARTER_ZIP_TRAINING_TOP_GRAY: 3,
} as const;

export interface SizeChartRow {
  size: string;
  length: number;  // 총장
  chest: number;   // 가슴단면 or 가슴둘레
  sleeve: number;  // 소매길이
  hem?: number;    // 밑단 (없는 상품도 있음)
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
  id: number;          // DB FK용 숫자 ID
  slug: ProductSlug;   // URL + 코드 식별자
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
  chestLabel?: string;  // 사이즈 표 가슴 열 헤더 (기본값: '가슴단면')
  comingSoon?: boolean; // true면 목록에서 Coming Soon 카드로 표시, 구매 불가
  details: ProductDetails;
}

export const products: Record<ProductSlug, Product> = {
  [PRODUCT_SLUGS.HALF_ZIP_TRAINING_TOP]: {
    id: PRODUCT_IDS.HALF_ZIP_TRAINING_TOP,
    slug: PRODUCT_SLUGS.HALF_ZIP_TRAINING_TOP,
    name: 'Half-Zip Training Top',
    price: 26900,
    originalPrice: 59000,
    image: '/apparel/half-zip-training-top/detail-1.jpg',
    images: [
      '/apparel/half-zip-training-top/thumb.png',
      '/apparel/half-zip-training-top/thumb2.png',
      '/apparel/half-zip-training-top/detail-1.jpg',
      '/apparel/half-zip-training-top/detail-point.jpg',
      '/apparel/half-zip-training-top/light-second.png',
      '/apparel/half-zip-training-top/light-main.png',
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

  [PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_BLACK]: {
    id: PRODUCT_IDS.QUARTER_ZIP_TRAINING_TOP_BLACK,
    slug: PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_BLACK,
    name: 'Quarter-Zip Training Top (Black)',
    comingSoon: true,
    price: 26900,
    originalPrice: 59000,
    image: '/apparel/quarter-zip-training-top-black/thumb.png',
    images: [
      '/apparel/quarter-zip-training-top-black/thumb.png',
      '/apparel/quarter-zip-training-top-black/thumb2.png',
    ],
    tagline: '바디 라인을 정돈하며, 격한 움직임도 자유롭게 — 쿼터집 트레이닝 탑 (블랙)',
    description:
      '편안한 착용감과 슬림한 실루엣을 동시에 잡은 Quarter-Zip Training Top. 탄탄한 고신축 원단으로 몸을 안정감 있게 잡아주면서도 움직임은 자유롭고, 땀은 빠르게 건조되어 격한 운동에도 쾌적함을 유지해 줍니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    features: [
      { label: '편안함과 슬림한 핏의 균형', detail: ' 바디 라인을 정돈해주면서도 답답함 없는 착용감.' },
      { label: '탄탄한 고신축 원단', detail: ' 움직임에 자연스럽게 반응하는 안정적인 핏감.' },
      { label: '자유로운 활동성', detail: ' 러닝, 웨이트, 구기 종목까지 폭넓게 대응.' },
      { label: '빠른 수분 배출 시스템', detail: ' 땀을 빠르게 흡수·건조해 운동 내내 쾌적함 유지.' },
    ],
    chestLabel: '가슴둘레',
    sizeChart: [
      { size: 'S',  length: 63, chest: 92, sleeve: 68 },
      { size: 'M',  length: 66, chest: 98, sleeve: 71 },
      { size: 'L',  length: 69, chest: 104, sleeve: 74 },
      { size: 'XL', length: 72, chest: 110, sleeve: 77 },
      { size: '2XL', length: 75, chest: 116, sleeve: 80 },
    ],
    details: {
      functions: [
        { title: '숄더 포인트 디테일', description: '미니멀한 상의에 입체적인 포인트 연출.' },
        { title: '하프 집업 넥라인', description: '체온 조절이 쉬운 구조로 실용성과 스타일 동시 확보.' },
        { title: '핑거홀 디자인', description: '핑거홀 디자인으로 안정적인 착용감.' },
        { title: '미니멀 로고 배치', description: '전면 심볼, 후면 BROSPICK 레터링으로 정체성 강조.' },
        { title: '리플렉티브 디테일', description: '조명 아래에서 은은하게 드러나는 기능적 포인트.' },
      ],
      design: [],
      material:
        '프리미엄 기능성 폴리에스터 + 스판 블렌드. 부드러운 터치감, 우수한 복원력, 세탁 후 뒤틀림과 수축 최소화.',
    },
  },

  [PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_GRAY]: {
    id: PRODUCT_IDS.QUARTER_ZIP_TRAINING_TOP_GRAY,
    slug: PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_GRAY,
    name: 'Quarter-Zip Training Top (Gray)',
    comingSoon: true,
    price: 26900,
    originalPrice: 59000,
    image: '/apparel/quarter-zip-training-top-gray/thumb.png',
    images: [
      '/apparel/quarter-zip-training-top-gray/thumb.png',
      '/apparel/quarter-zip-training-top-gray/thumb2.png',
    ],
    tagline: '바디 라인을 정돈하며, 격한 움직임도 자유롭게 — 쿼터집 트레이닝 탑 (그레이)',
    description:
      '편안한 착용감과 슬림한 실루엣을 동시에 잡은 Quarter-Zip Training Top. 탄탄한 고신축 원단으로 몸을 안정감 있게 잡아주면서도 움직임은 자유롭고, 땀은 빠르게 건조되어 격한 운동에도 쾌적함을 유지해 줍니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    features: [
      { label: '편안함과 슬림한 핏의 균형', detail: ' 바디 라인을 정돈해주면서도 답답함 없는 착용감.' },
      { label: '탄탄한 고신축 원단', detail: ' 움직임에 자연스럽게 반응하는 안정적인 핏감.' },
      { label: '자유로운 활동성', detail: ' 러닝, 웨이트, 구기 종목까지 폭넓게 대응.' },
      { label: '빠른 수분 배출 시스템', detail: ' 땀을 빠르게 흡수·건조해 운동 내내 쾌적함 유지.' },
    ],
    chestLabel: '가슴둘레',
    sizeChart: [
      { size: 'S',  length: 63, chest: 92, sleeve: 68 },
      { size: 'M',  length: 66, chest: 98, sleeve: 71 },
      { size: 'L',  length: 69, chest: 104, sleeve: 74 },
      { size: 'XL', length: 72, chest: 110, sleeve: 77 },
      { size: '2XL', length: 75, chest: 116, sleeve: 80 },
    ],
    details: {
      functions: [
        { title: '숄더 포인트 디테일', description: '미니멀한 상의에 입체적인 포인트 연출.' },
        { title: '하프 집업 넥라인', description: '체온 조절이 쉬운 구조로 실용성과 스타일 동시 확보.' },
        { title: '핑거홀 디자인', description: '핑거홀 디자인으로 안정적인 착용감.' },
        { title: '미니멀 로고 배치', description: '전면 심볼, 후면 BROSPICK 레터링으로 정체성 강조.' },
        { title: '리플렉티브 디테일', description: '조명 아래에서 은은하게 드러나는 기능적 포인트.' },
      ],
      design: [],
      material:
        '프리미엄 기능성 폴리에스터 + 스판 블렌드. 부드러운 터치감, 우수한 복원력, 세탁 후 뒤틀림과 수축 최소화.',
    },
  },
};

// 목록 페이지용 간략 상품 리스트
export const productList = Object.values(products).map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: p.price,
  originalPrice: p.originalPrice,
  image: p.images[0],
  description: p.tagline,
  comingSoon: p.comingSoon ?? false,
}));

// 할인율 계산 헬퍼
export function getDiscountPercent(price: number, originalPrice: number): number {
  return Math.round((1 - price / originalPrice) * 100);
}

// 상품 이름으로 조회 (교환/반품 폼 등 DB에 product_name이 저장된 경우 사용)
export function getProductByName(name: string): Product | undefined {
  return Object.values(products).find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}
