// 상품 데이터 - 가격, 이미지, 사이즈 등을 한 곳에서 관리
//
// 새 상품 추가 체크리스트:
//   1. PRODUCT_SLUGS 에 항목 추가
//   2. PRODUCT_IDS 에 항목 추가
//   3. products 객체에 데이터 추가
//   4. public/apparel/[slug]/ 폴더 만들고 이미지 넣기
//   5. Supabase product_sizes 테이블에 새 product_id 행 추가

export const PRODUCT_FALLBACK_IMAGE = '/apparel/training-top/half-zip/half-zip-training-top/brospick-half-zip-trainging-top-1.png';

// URL + 코드 식별자 (오타 방지용 타입 안전 상수)
export const PRODUCT_SLUGS = {
  HALF_ZIP_TRAINING_TOP: 'half-zip-training-top',
  QUARTER_ZIP_TRAINING_TOP_BLACK: 'quarter-zip-training-top-black',
  QUARTER_ZIP_TRAINING_TOP_GRAY: 'quarter-zip-training-top-gray',
  CAMEL_GRAY_SHORT_SLEEVE: 'camel-gray-short-sleeve',
  RUNNING_LONG_SLEEVE_TOP_GRAY: 'running-long-sleeve-top-gray',
  RUNNING_LONG_SLEEVE_TOP_BLACK: 'running-long-sleeve-top-black',
  GRID_ZIP_HOODIE: 'grid-zip-hoodie',
  TECH_TRAINING_SHORTS_BLACK: 'tech-training-shorts-black',
  TECH_TRAINING_SHORTS_GRAY: 'tech-training-shorts-gray',
  MOTION_TECH_SHORTS_BLACK: 'motion-tech-shorts-black',
  MOTION_TECH_SHORTS_GRAY: 'motion-tech-shorts-gray',
  QUARTER_ZIP_FLEX_BLUE: 'quarter-zip-flex-blue',
  QUARTER_ZIP_FLEX_LIGHT_GREEN: 'quarter-zip-flex-light-green',
  MOTION_TECH_PANTS_BLACK: 'motion-tech-pants-black',
  MOTION_TECH_PANTS_GRAY: 'motion-tech-pants-gray',
  CROSS_C_TAPING_BLACK: 'cross-c-taping-black',
  CROSS_C_TAPING_GOLD: 'cross-c-taping-gold',
  PHILIPPIANS_413_C_TAPING: 'philippians-413-c-taping',
} as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[keyof typeof PRODUCT_SLUGS];

// DB FK (Supabase product_sizes.product_id) 숫자 ID 중앙화
export const PRODUCT_IDS = {
  HALF_ZIP_TRAINING_TOP: 1,
  QUARTER_ZIP_TRAINING_TOP_BLACK: 2,
  QUARTER_ZIP_TRAINING_TOP_GRAY: 3,
  CAMEL_GRAY_SHORT_SLEEVE: 4,
  RUNNING_LONG_SLEEVE_TOP_GRAY: 5,
  RUNNING_LONG_SLEEVE_TOP_BLACK: 6,
  GRID_ZIP_HOODIE: 7,
  TECH_TRAINING_SHORTS_BLACK: 8,
  TECH_TRAINING_SHORTS_GRAY: 9,
  MOTION_TECH_SHORTS_BLACK: 10,
  MOTION_TECH_SHORTS_GRAY: 12,
  QUARTER_ZIP_FLEX_BLUE: 11,
  QUARTER_ZIP_FLEX_LIGHT_GREEN: 13,
  MOTION_TECH_PANTS_BLACK: 14,
  MOTION_TECH_PANTS_GRAY: 15,
  CROSS_C_TAPING_BLACK: 16,
  CROSS_C_TAPING_GOLD: 17,
  PHILIPPIANS_413_C_TAPING: 18,
} as const;

export interface SizeChartRow {
  size: string;
  length: number;   // 총장
  chest?: number;   // 가슴단면 or 가슴둘레 (top용)
  sleeve?: number;  // 소매길이 (top용)
  hem?: number;     // 밑단
  waist?: number;   // 허리(반둘레) - shorts/pants용
  hip?: number;     // 엉덩이 - shorts/pants용
  rise?: number;    // 앞밑위 - pants용
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

export interface ProductVariant {
  label: string;
  image: string;
  color?: string; // CSS color for swatch dot
}

export type ProductCategory = 'training-top' | 'short-sleeve' | 'long-sleeve' | 'hoodie' | 'shorts' | 'pants' | 'taping';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'training-top': '트레이닝 탑',
  'short-sleeve': '반팔',
  'long-sleeve': '긴팔',
  'hoodie': '후드',
  'shorts': '반바지',
  'pants': '팬츠',
  'taping': '테이핑',
};

export interface Product {
  id: number;          // DB FK용 숫자 ID
  slug: ProductSlug;   // URL + 코드 식별자
  name: string;
  category: ProductCategory;
  image: string;
  images: string[];
  tagline: string;
  description: string;
  sizes: string[];
  features: ProductFeature[];
  sizeChart: SizeChartRow[];
  chestLabel?: string;       // 사이즈 표 가슴 열 헤더 (기본값: '가슴단면')
  sizeChartType?: 'top' | 'shorts' | 'pants'; // 사이즈 표 컬럼 구성 (기본값: 'top')
  comingSoon?: boolean; // true면 목록에서 Coming Soon 카드로 표시, 구매 불가
  variants?: ProductVariant[]; // 묶어서 보여줄 컬러 variants (Coming Soon 그룹)
  hideFromList?: boolean; // true면 productList에서 제외 (다른 상품의 variant로 표시됨)
  details: ProductDetails;
}

export const products: Record<ProductSlug, Product> = {
  [PRODUCT_SLUGS.HALF_ZIP_TRAINING_TOP]: {
    id: PRODUCT_IDS.HALF_ZIP_TRAINING_TOP,
    slug: PRODUCT_SLUGS.HALF_ZIP_TRAINING_TOP,
    name: 'Half-Zip Training Top',
    category: 'training-top',
    image: '/apparel/training-top/half-zip/half-zip-training-top/detail-1.jpg',
    images: [
      '/apparel/training-top/half-zip/half-zip-training-top/thumb.png',
      '/apparel/training-top/half-zip/half-zip-training-top/thumb2.png',
      '/apparel/training-top/half-zip/half-zip-training-top/half-zip-detail-all.png',
      '/apparel/training-top/half-zip/half-zip-training-top/detail-1.jpg',
      '/apparel/training-top/half-zip/half-zip-training-top/detail-point.jpg',
      '/apparel/training-top/half-zip/half-zip-training-top/light-second.png',
      '/apparel/training-top/half-zip/half-zip-training-top/light-main.png',
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
    category: 'training-top',
    comingSoon: true,
    image: '/apparel/training-top/quarter-zip/quarter-zip-training-top-black/thumb.png',
    images: [
      '/apparel/training-top/quarter-zip/quarter-zip-training-top-black/thumb.png',
      '/apparel/training-top/quarter-zip/quarter-zip-training-top-black/thumb2.png',
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
      { size: 'S', length: 63, chest: 92, sleeve: 68 },
      { size: 'M', length: 66, chest: 98, sleeve: 71 },
      { size: 'L', length: 69, chest: 104, sleeve: 74 },
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

  [PRODUCT_SLUGS.CAMEL_GRAY_SHORT_SLEEVE]: {
    id: PRODUCT_IDS.CAMEL_GRAY_SHORT_SLEEVE,
    slug: PRODUCT_SLUGS.CAMEL_GRAY_SHORT_SLEEVE,
    name: 'Camel Gray Short Sleeve',
    category: 'short-sleeve',
    comingSoon: true,
    image: '/apparel/short-sleeve/camel-gray/1-camel-gray-short-sleeve-1.png',
    images: [
      '/apparel/short-sleeve/camel-gray/1-camel-gray-short-sleeve-1.png',
      '/apparel/short-sleeve/camel-gray/2-camel-gray-short-sleeve-2.png',
      '/apparel/short-sleeve/camel-gray/3-camel-gray-3.png',
      '/apparel/short-sleeve/camel-gray/4-camel-gray-4.png',
    ],
    tagline: '가볍고, 빠르게 마르고, 형태는 그대로',
    description:
      '카멜 그레이 쇼트 슬리브는 소로나 50% + 폴리에스터(스판덱스 혼합) 50%의 경량 혼방 원단으로 제작되어, 입었을 때의 부담감을 최소화한 기능성 트레이닝 상의입니다. 일상 훈련부터 원정 경기까지, 주름 없이 가방에서 꺼내 바로 착용할 수 있고, 땀을 빠르게 배출해 쾌적한 착용감을 오래 유지합니다. 후면 봉제선과 브로스픽 심볼에 적용된 빛반사 스티치는 야간 훈련 시 시인성을 높이는 동시에 제품에 디테일을 더합니다. UPF 50+ 자외선 차단 기능으로 야외 활동에서도 피부를 보호합니다.',
    sizes: ['M', 'L', 'XL', '2XL', '3XL'],
    features: [
      { label: '노 아이언 관리', detail: ' — 주름에 강한 원단으로 가방에서 꺼내 바로 착용 가능' },
      { label: '초경량 155G', detail: ' — 착용 중 원단의 무게감을 거의 느끼지 못합니다' },
      { label: 'QUICK-DRY + BREATHABLE', detail: ' — 빠른 땀 배출과 우수한 통기성으로 훈련 내내 쾌적' },
      { label: '빛반사 스티치 디테일', detail: ' — 야간 훈련 시인성 + 브로스픽 아이덴티티를 동시에' },
      { label: 'UPF 50+ 자외선 차단', detail: ' — 야외 훈련, 경기 모두 커버' },
    ],
    sizeChart: [
      { size: 'M', length: 70, chest: 53.5, sleeve: 21.5 },
      { size: 'L', length: 72, chest: 55.5, sleeve: 22.5 },
      { size: 'XL', length: 74, chest: 57.5, sleeve: 23.5 },
      { size: '2XL', length: 76, chest: 59.5, sleeve: 24.5 },
      { size: '3XL', length: 78, chest: 61.5, sleeve: 25.5 },
    ],
    details: {
      functions: [
        { title: '노 아이언 관리', description: '주름에 강한 원단으로 가방에서 꺼내 바로 착용 가능.' },
        { title: 'QUICK-DRY', description: '땀을 빠르게 흡수·건조해 훈련 내내 쾌적함 유지.' },
        { title: 'BREATHABLE', description: '우수한 통기성으로 장시간 착용에도 답답함 없음.' },
        { title: 'UPF 50+', description: '자외선 차단 기능으로 야외 활동에서도 피부 보호.' },
        { title: '초경량 155G', description: '착용 중 원단의 무게감을 거의 느끼지 못하는 가벼운 착용감.' },
      ],
      design: [
        { title: '빛반사 스티치 로고', description: '브로스픽 심볼 빛반사 스티치로 아이덴티티 강조.' },
        { title: '후면 봉제선 빛반사 디테일', description: '야간 훈련 시 시인성 향상, 조명 아래 은은한 포인트 연출.' },
      ],
      material:
        '소로나 50% + 폴리에스터(스판덱스 혼합) 50%. 가볍고 부드러운 촉감, 세탁 후 형태 변형 없는 내구성.',
    },
  },

  [PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_GRAY]: {
    id: PRODUCT_IDS.QUARTER_ZIP_TRAINING_TOP_GRAY,
    slug: PRODUCT_SLUGS.QUARTER_ZIP_TRAINING_TOP_GRAY,
    name: 'Quarter-Zip Training Top (Gray)',
    category: 'training-top',
    comingSoon: true,
    image: '/apparel/training-top/quarter-zip/quarter-zip-training-top-gray/thumb.png',
    images: [
      '/apparel/training-top/quarter-zip/quarter-zip-training-top-gray/thumb.png',
      '/apparel/training-top/quarter-zip/quarter-zip-training-top-gray/thumb2.png',
    ],
    tagline: '벌집 구조 원단으로 통기성과 쿨링을 동시에 — 쿼터집 트레이닝 탑 (그레이)',
    description:
      '폴리에스터 90% + 스판덱스 10%의 얇고 가벼운 원단으로 제작된 기능성 쿨링 티셔츠. 벌집 구조 설계로 자연스러운 통기 구멍을 형성해 공기 순환을 유도하고, 땀을 빠르게 흡수·건조합니다. 건강하고 안전한 소재로 피부에 부드럽고, 반복 세탁에도 색 빠짐 없이 형태를 유지합니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    features: [
      { label: '빠른 건조', detail: ' — 땀 흡수 후 빠르게 건조, 운동 내내 쾌적' },
      { label: '통기성', detail: ' — 벌집 구조로 공기 순환 유도, 답답함 없음' },
      { label: '흡습', detail: ' — 운동 중 발생하는 땀을 효율적으로 배출' },
      { label: '보풀 방지', detail: ' — 반복 세탁에도 깔끔한 원단 상태 유지' },
    ],
    chestLabel: '가슴둘레',
    sizeChart: [
      { size: 'S', length: 63, chest: 92, sleeve: 68 },
      { size: 'M', length: 66, chest: 98, sleeve: 71 },
      { size: 'L', length: 69, chest: 104, sleeve: 74 },
      { size: 'XL', length: 72, chest: 110, sleeve: 77 },
      { size: '2XL', length: 75, chest: 116, sleeve: 80 },
    ],
    details: {
      functions: [
        { title: '벌집 구조 원단', description: '자연스러운 통기 구멍 형성으로 공기 순환 유도.' },
        { title: '퀵드라이', description: '땀 흡수 후 빠르게 건조해 훈련 내내 쾌적함 유지.' },
        { title: '흡습', description: '운동 중 발생하는 땀을 효율적으로 배출.' },
        { title: '보풀 방지', description: '반복 세탁에도 원단 표면 상태 유지.' },
        { title: '세탁 내구성', description: '세탁 후 색 빠짐 없음. 건강하고 안전한 소재.' },
      ],
      design: [
        { title: '미니멀 로고 배치', description: '전면 심볼, 후면 BROSPICK 레터링으로 정체성 강조.' },
        { title: '리플렉티브 디테일', description: '조명 아래에서 은은하게 드러나는 기능적 포인트.' },
      ],
      material:
        '폴리에스터 90% + 스판덱스 10%. 얇고 가벼운 원단, 벌집 구조 설계. 피부에 부드럽고 세탁 후 색 빠짐 없음.',
    },
  },

  [PRODUCT_SLUGS.RUNNING_LONG_SLEEVE_TOP_GRAY]: {
    id: PRODUCT_IDS.RUNNING_LONG_SLEEVE_TOP_GRAY,
    slug: PRODUCT_SLUGS.RUNNING_LONG_SLEEVE_TOP_GRAY,
    name: 'Running Long Sleeve Top (Gray)',
    category: 'long-sleeve',
    comingSoon: true,
    image: '/apparel/long-sleeve/running-top/gray/1-thumb-1.png',
    images: [
      '/apparel/long-sleeve/running-top/gray/1-thumb-1.png',
      '/apparel/long-sleeve/running-top/gray/2-thumb-2.png',
      '/apparel/long-sleeve/running-top/gray/3-thumb-3.png',
      '/apparel/long-sleeve/running-top/4-detail-4.png',
      '/apparel/long-sleeve/running-top/5-detail-5.png',
      '/apparel/long-sleeve/running-top/6-detail-6.png',
      '/apparel/long-sleeve/running-top/7-detail-7.png',
      '/apparel/long-sleeve/running-top/8-detail-8.png',
      '/apparel/long-sleeve/running-top/9-detail-9.png',
      '/apparel/long-sleeve/running-top/10-detail-10.png',
      '/apparel/long-sleeve/running-top/11-detail-11.png',
      '/apparel/long-sleeve/running-top/12-detail-12.png',
      '/apparel/long-sleeve/running-top/13-size-chart.JPG',
    ],
    tagline: '가볍게, 빠르게, 그리고 멀리.',
    description:
      '브로스픽의 Running Long Sleeve Top은 160g의 초경량 기능성 원단으로 제작되어 러닝과 트레이닝 모든 순간에 최적화된 퍼포먼스를 제공합니다. Polyester 100% 소재 특유의 부드러운 터치감과 뛰어난 통기성으로 장시간 착용에도 쾌적한 착용감을 유지합니다. 소매 핑거홀 디자인은 러닝 중 소매가 흘러내리는 불편함을 방지하고, 히든 지퍼 포켓은 키나 카드 등 소지품을 간편하게 수납할 수 있습니다. 전·후면 빛반사 로고 디테일은 야간 러닝 시 시인성을 높여 안전하고 스타일리시하게 달릴 수 있도록 합니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '초경량 160G', detail: ' — 입는 순간 부담 없는 가벼운 착용감' },
      { label: '소매 핑거홀 디자인', detail: ' — 러닝 중 소매 흘러내림 방지, 손등 보온 커버' },
      { label: '히든 지퍼 포켓', detail: ' — 키·카드 수납 가능한 실용적인 포켓 내장' },
      { label: '전·후면 빛반사 로고', detail: ' — 야간 러닝 시 시인성 확보' },
      { label: 'Polyester 100%', detail: ' — 통기성·경량성·피부 친화적 기능성 원단' },
    ],
    sizeChart: [
      { size: 'M', length: 70, chest: 54, sleeve: 61.5 },
      { size: 'L', length: 72, chest: 56, sleeve: 63.1 },
      { size: 'XL', length: 74, chest: 58, sleeve: 64.7 },
      { size: '2XL', length: 76, chest: 60, sleeve: 66.5 },
    ],
    details: {
      functions: [
        { title: '소매 핑거홀', description: '러닝 중 소매 흘러내림 방지, 손등을 가볍게 감싸 보온성 추가.' },
        { title: '히든 지퍼 포켓', description: '키·카드 수납 가능. 외부에 드러나지 않는 깔끔한 구조.' },
        { title: '초경량 160G', description: '착용 중 원단의 무게감을 거의 느끼지 못하는 가벼운 착용감.' },
        { title: '통기성', description: '장시간 착용에도 불쾌한 열감 없이 쾌적함 유지.' },
      ],
      design: [
        { title: '전·후면 빛반사 로고', description: '야간 러닝 시 시인성 향상, 조명 아래 은은한 포인트 연출.' },
      ],
      material: 'Polyester 100%. 부드러운 기능성 스포츠 원단, 우수한 통기성과 경량성.',
    },
  },

  [PRODUCT_SLUGS.RUNNING_LONG_SLEEVE_TOP_BLACK]: {
    id: PRODUCT_IDS.RUNNING_LONG_SLEEVE_TOP_BLACK,
    slug: PRODUCT_SLUGS.RUNNING_LONG_SLEEVE_TOP_BLACK,
    name: 'Running Long Sleeve Top (Black)',
    category: 'long-sleeve',
    comingSoon: true,
    image: '/apparel/long-sleeve/running-top/black/1-thumb-1.png',
    images: [
      '/apparel/long-sleeve/running-top/black/1-thumb-1.png',
      '/apparel/long-sleeve/running-top/black/2-thumb-2.png',
      '/apparel/long-sleeve/running-top/black/3-thumb-3.png',
      '/apparel/long-sleeve/running-top/4-detail-4.png',
      '/apparel/long-sleeve/running-top/5-detail-5.png',
      '/apparel/long-sleeve/running-top/6-detail-6.png',
      '/apparel/long-sleeve/running-top/7-detail-7.png',
      '/apparel/long-sleeve/running-top/8-detail-8.png',
      '/apparel/long-sleeve/running-top/9-detail-9.png',
      '/apparel/long-sleeve/running-top/10-detail-10.png',
      '/apparel/long-sleeve/running-top/11-detail-11.png',
      '/apparel/long-sleeve/running-top/12-detail-12.png',
    ],
    tagline: '가볍게, 빠르게, 그리고 멀리.',
    description:
      '브로스픽의 Running Long Sleeve Top은 160g의 초경량 기능성 원단으로 제작되어 러닝과 트레이닝 모든 순간에 최적화된 퍼포먼스를 제공합니다. Polyester 100% 소재 특유의 부드러운 터치감과 뛰어난 통기성으로 장시간 착용에도 쾌적한 착용감을 유지합니다. 소매 핑거홀 디자인은 러닝 중 소매가 흘러내리는 불편함을 방지하고, 히든 지퍼 포켓은 키나 카드 등 소지품을 간편하게 수납할 수 있습니다. 전·후면 빛반사 로고 디테일은 야간 러닝 시 시인성을 높여 안전하고 스타일리시하게 달릴 수 있도록 합니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '초경량 160G', detail: ' — 입는 순간 부담 없는 가벼운 착용감' },
      { label: '소매 핑거홀 디자인', detail: ' — 러닝 중 소매 흘러내림 방지, 손등 보온 커버' },
      { label: '히든 지퍼 포켓', detail: ' — 키·카드 수납 가능한 실용적인 포켓 내장' },
      { label: '전·후면 빛반사 로고', detail: ' — 야간 러닝 시 시인성 확보' },
      { label: 'Polyester 100%', detail: ' — 통기성·경량성·피부 친화적 기능성 원단' },
    ],
    sizeChart: [
      { size: 'M', length: 70, chest: 54, sleeve: 61.5 },
      { size: 'L', length: 72, chest: 56, sleeve: 63.1 },
      { size: 'XL', length: 74, chest: 58, sleeve: 64.7 },
      { size: '2XL', length: 76, chest: 60, sleeve: 66.5 },
    ],
    details: {
      functions: [
        { title: '소매 핑거홀', description: '러닝 중 소매 흘러내림 방지, 손등을 가볍게 감싸 보온성 추가.' },
        { title: '히든 지퍼 포켓', description: '키·카드 수납 가능. 외부에 드러나지 않는 깔끔한 구조.' },
        { title: '초경량 160G', description: '착용 중 원단의 무게감을 거의 느끼지 못하는 가벼운 착용감.' },
        { title: '통기성', description: '장시간 착용에도 불쾌한 열감 없이 쾌적함 유지.' },
      ],
      design: [
        { title: '전·후면 빛반사 로고', description: '야간 러닝 시 시인성 향상, 조명 아래 은은한 포인트 연출.' },
      ],
      material: 'Polyester 100%. 부드러운 기능성 스포츠 원단, 우수한 통기성과 경량성.',
    },
  },

  [PRODUCT_SLUGS.GRID_ZIP_HOODIE]: {
    id: PRODUCT_IDS.GRID_ZIP_HOODIE,
    slug: PRODUCT_SLUGS.GRID_ZIP_HOODIE,
    category: 'hoodie',
    name: 'GRID ZIP HOODIE',
    comingSoon: true,
    image: '/apparel/hoodie/1-grid-zip-hoodie-1.png',
    images: [
      '/apparel/hoodie/1-grid-zip-hoodie-1.png',
      '/apparel/hoodie/2-grid-zip-hoodie-2.png',
      '/apparel/hoodie/3-grid-zip-hoodie-3.png',
      '/apparel/hoodie/4-grid-zip-hoodie-4.png',
      '/apparel/hoodie/5-grid-zip-hoodie-5.png',
      '/apparel/hoodie/6-grid-zip-hoodie-6.png',
      '/apparel/hoodie/7-grid-zip-hoodie-7.png',
      '/apparel/hoodie/8-grid-zip-hoodie-8.png',
      '/apparel/hoodie/9-grid-zip-hoodie-9.png',
      '/apparel/hoodie/10-grid-zip-hoodie-10.png',
      '/apparel/hoodie/11-후드집업 사이즈표.png',
    ],
    tagline: '부드러운 기능성 와플 텍스처 원단에 히든 지퍼 포켓과 전면 반사 로고 디테일을 더한 일상용 후드집업.',
    description:
      '그레이 컬러의 GRID ZIP HOODIE는 러닝웨어와 트레이닝웨어에 모두 어울리는 기능성 후드집업입니다. 부드럽고 가벼운 기능성 스포츠 원단에 와플 텍스처 그리드 조직을 적용해 쾌적하고 활동적인 착용감을 제공합니다. 히든 지퍼 포켓으로 수납 안정성을 높였고, 전면 빛반사 로고 디테일로 러닝 시에도 시인성을 더했습니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '히든 지퍼 포켓', detail: ' — 키·카드 수납 가능한 실용적인 포켓 내장' },
      { label: '전면 빛반사 로고', detail: ' — 야간 러닝 시 시인성 확보' },
      { label: '통기성', detail: ' — 와플 텍스처 원단으로 쾌적한 착용감 유지' },
      { label: '가벼운 착용감', detail: ' — 일상과 운동 모두에 부담 없는 경량 원단' },
      { label: '피부 친화 · 부드러운 촉감', detail: ' — 장시간 착용에도 자극 없는 소재' },
    ],
    chestLabel: '가슴둘레',
    sizeChart: [
      { size: 'M', length: 67, chest: 110, sleeve: 77 },
      { size: 'L', length: 69, chest: 114, sleeve: 79 },
      { size: 'XL', length: 71, chest: 118, sleeve: 81 },
      { size: '2XL', length: 73, chest: 122, sleeve: 83 },
    ],
    details: {
      functions: [
        { title: '히든 지퍼 포켓', description: '키·카드 수납 가능. 외부에 드러나지 않는 깔끔한 구조.' },
        { title: '전면 빛반사 로고', description: '야간 러닝 시 시인성 향상, 조명 아래 은은한 포인트 연출.' },
        { title: '통기성', description: '와플 텍스처 그리드 조직으로 공기 순환을 유도해 장시간 착용에도 쾌적함 유지.' },
        { title: '가벼운 착용감', description: '경량 기능성 원단으로 운동 중에도 부담 없는 착용감.' },
        { title: '피부 친화', description: '부드러운 촉감의 소재로 피부 자극 최소화.' },
      ],
      design: [
        { title: '와플 텍스처 그리드 원단', description: '입체감 있는 표면감으로 미니멀한 무드에 포인트 연출.' },
        { title: '그레이 컬러', description: '일상과 운동 모두에 어울리는 깔끔한 무드.' },
        { title: '전면 반사 로고', description: '스포티한 포인트 강조.' },
      ],
      material: '폴리에스터 95% + 스판덱스 5%. 부드럽고 가벼운 기능성 스포츠 원단, 적절한 신축성과 피부 친화적 착용감.',
    },
  },

  [PRODUCT_SLUGS.TECH_TRAINING_SHORTS_BLACK]: {
    id: PRODUCT_IDS.TECH_TRAINING_SHORTS_BLACK,
    slug: PRODUCT_SLUGS.TECH_TRAINING_SHORTS_BLACK,
    name: 'Tech Training Shorts (Black)',
    category: 'shorts',
    comingSoon: true,
    image: '/apparel/shorts/training-shorts/tech-training-shorts/black/1-tech-training-shorts-black-1.png',
    images: [
      '/apparel/shorts/training-shorts/tech-training-shorts/black/1-tech-training-shorts-black-1.png',
      '/apparel/shorts/training-shorts/3-size-chart-3.png',
    ],
    tagline: '경량 기능성 원단과 사이드 슬릿, 안정적인 밴딩 구조로 퍼포먼스와 착용감을 동시에 잡은 테크 트레이닝 쇼츠.',
    description:
      '가볍고 신축성 좋은 프리미엄 기능성 원단으로 완성한 테크 트레이닝 쇼츠입니다. 활동성을 높여주는 사이드 슬릿 디테일과 탄탄한 밴딩 웨이스트를 적용해, 운동 시에도 안정적이고 편안한 착용감을 제공합니다. 끈 없이도 밀착감 있게 잡아주는 허리 구조로 더욱 깔끔하고 실용적인 핏을 구현했으며, 장시간 착용에도 부담 없이 자유로운 움직임을 느낄 수 있습니다. 미니멀한 디자인에 빛반사 스카치 로고를 더해, 데일리와 스포츠 무드 모두에 자연스럽게 어울리는 퍼포먼스 쇼츠입니다.',
    sizes: ['M', 'L', 'XL'],
    sizeChartType: 'shorts',
    features: [
      { label: '경량 기능성 원단', detail: ' — 가볍고 신축성 좋은 프리미엄 소재' },
      { label: '빠른 건조', detail: ' — 땀 흡수 후 빠른 건조로 운동 내내 쾌적' },
      { label: '안정적인 밴딩 허리', detail: ' — 끈 없이도 안정적인 착용감' },
      { label: '사이드 슬릿', detail: ' — 활동성 강화 옆 트임 디테일' },
      { label: '빛반사 스카치 로고', detail: ' — 야간 시인성 강화' },
    ],
    sizeChart: [
      { size: 'M', length: 46, waist: 38, hem: 30 },
      { size: 'L', length: 48, waist: 39.5, hem: 31 },
      { size: 'XL', length: 50, waist: 41, hem: 32 },
    ],
    details: {
      functions: [
        { title: '경량 기능성 원단', description: '가볍고 신축성 좋은 프리미엄 소재로 운동 중 부담 없는 착용감.' },
        { title: '빠른 건조', description: '땀 흡수 후 빠르게 건조해 훈련 내내 쾌적함 유지.' },
        { title: '우수한 신축성', description: '모든 방향으로 자유롭게 늘어나 활동성을 극대화.' },
        { title: '안정적인 밴딩 허리', description: '끈 없이도 밀착감 있게 잡아주는 허리 구조.' },
        { title: '사이드 포켓', description: '운동 중 소지품을 편리하게 수납.' },
      ],
      design: [
        { title: '옆단 트임 디테일', description: '사이드 슬릿으로 움직임 자유도 향상과 스타일리시한 실루엣 연출.' },
        { title: '밴딩 웨이스트', description: '깔끔하고 실용적인 허리 구조.' },
        { title: '미니멀 실루엣', description: '데일리와 스포츠 무드 모두에 어울리는 심플한 디자인.' },
        { title: '빛반사 스카치 로고', description: '야간 시인성 강화 및 브로스픽 아이덴티티 표현.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%. 가볍고 신축성 좋은 프리미엄 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.TECH_TRAINING_SHORTS_GRAY]: {
    id: PRODUCT_IDS.TECH_TRAINING_SHORTS_GRAY,
    slug: PRODUCT_SLUGS.TECH_TRAINING_SHORTS_GRAY,
    name: 'Tech Training Shorts (Gray)',
    category: 'shorts',
    comingSoon: true,
    image: '/apparel/shorts/training-shorts/tech-training-shorts/gray/1-tech-training-shorts-gray-1.png',
    images: [
      '/apparel/shorts/training-shorts/tech-training-shorts/gray/1-tech-training-shorts-gray-1.png',
      '/apparel/shorts/training-shorts/3-size-chart-3.png',
    ],
    tagline: '경량 기능성 원단과 사이드 슬릿, 안정적인 밴딩 구조로 퍼포먼스와 착용감을 동시에 잡은 테크 트레이닝 쇼츠.',
    description:
      '가볍고 신축성 좋은 프리미엄 기능성 원단으로 완성한 테크 트레이닝 쇼츠입니다. 활동성을 높여주는 사이드 슬릿 디테일과 탄탄한 밴딩 웨이스트를 적용해, 운동 시에도 안정적이고 편안한 착용감을 제공합니다. 끈 없이도 밀착감 있게 잡아주는 허리 구조로 더욱 깔끔하고 실용적인 핏을 구현했으며, 장시간 착용에도 부담 없이 자유로운 움직임을 느낄 수 있습니다. 미니멀한 디자인에 빛반사 스카치 로고를 더해, 데일리와 스포츠 무드 모두에 자연스럽게 어울리는 퍼포먼스 쇼츠입니다.',
    sizes: ['M', 'L', 'XL'],
    sizeChartType: 'shorts',
    features: [
      { label: '경량 기능성 원단', detail: ' — 가볍고 신축성 좋은 프리미엄 소재' },
      { label: '빠른 건조', detail: ' — 땀 흡수 후 빠른 건조로 운동 내내 쾌적' },
      { label: '안정적인 밴딩 허리', detail: ' — 끈 없이도 안정적인 착용감' },
      { label: '사이드 슬릿', detail: ' — 활동성 강화 옆 트임 디테일' },
      { label: '빛반사 스카치 로고', detail: ' — 야간 시인성 강화' },
    ],
    sizeChart: [
      { size: 'M', length: 46, waist: 38, hem: 30 },
      { size: 'L', length: 48, waist: 39.5, hem: 31 },
      { size: 'XL', length: 50, waist: 41, hem: 32 },
    ],
    details: {
      functions: [
        { title: '경량 기능성 원단', description: '가볍고 신축성 좋은 프리미엄 소재로 운동 중 부담 없는 착용감.' },
        { title: '빠른 건조', description: '땀 흡수 후 빠르게 건조해 훈련 내내 쾌적함 유지.' },
        { title: '우수한 신축성', description: '모든 방향으로 자유롭게 늘어나 활동성을 극대화.' },
        { title: '안정적인 밴딩 허리', description: '끈 없이도 밀착감 있게 잡아주는 허리 구조.' },
        { title: '사이드 포켓', description: '운동 중 소지품을 편리하게 수납.' },
      ],
      design: [
        { title: '옆단 트임 디테일', description: '사이드 슬릿으로 움직임 자유도 향상과 스타일리시한 실루엣 연출.' },
        { title: '밴딩 웨이스트', description: '깔끔하고 실용적인 허리 구조.' },
        { title: '미니멀 실루엣', description: '데일리와 스포츠 무드 모두에 어울리는 심플한 디자인.' },
        { title: '빛반사 스카치 로고', description: '야간 시인성 강화 및 브로스픽 아이덴티티 표현.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%. 가볍고 신축성 좋은 프리미엄 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.MOTION_TECH_SHORTS_BLACK]: {
    id: PRODUCT_IDS.MOTION_TECH_SHORTS_BLACK,
    slug: PRODUCT_SLUGS.MOTION_TECH_SHORTS_BLACK,
    name: 'Motion Tech Shorts (Black)',
    category: 'shorts',
    comingSoon: true,
    image: '/apparel/shorts/training-shorts/motion-training-shorts/black/1-motion-training-shorts-black-1.png',
    images: [
      '/apparel/shorts/training-shorts/motion-training-shorts/black/1-motion-training-shorts-black-1.png',
      '/apparel/shorts/training-shorts/motion-training-shorts/3-size-chart-3.png',
    ],
    tagline: '언밸런스 기장과 사이드 슬릿, 반사 디테일에 행거 루프까지 더해 실용성과 퍼포먼스를 완성한 테크 쇼츠.',
    description:
      '프리미엄 기능성 원단으로 제작된 Motion Tech Shorts는 가볍고 신축성 좋은 착용감으로 움직임이 많은 일상과 액티브한 활동 모두에 적합한 반바지입니다. 허리 밴딩 구조로 안정적인 착용감을 제공하며, 앞뒤 언밸런스 기장과 사이드 슬릿 디테일이 더해져 입체적이고 세련된 실루엣을 완성합니다. 미니멀한 테크웨어 무드의 디자인에 사이드 지퍼 포켓, 뒷면 행거 루프, 빛반사 스카치 로고와 측면 반사 패치를 적용해 기능성과 디자인 완성도를 모두 높였습니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    sizeChartType: 'shorts',
    features: [
      { label: '허리 밴딩 구조', detail: ' — 안정적인 착용감' },
      { label: '활동성 강화 사이드 슬릿', detail: ' — 자유로운 움직임 지원' },
      { label: '사이드 지퍼 포켓', detail: ' — 소지품 수납과 보안을 동시에' },
      { label: '뒷면 행거 루프', detail: ' — 실용적인 수납 디테일' },
      { label: '빛반사 스카치 로고 + 측면 반사 패치', detail: ' — 야간 시인성 강화' },
    ],
    sizeChart: [
      { size: 'M', length: 98, waist: 45, hip: 51, hem: 45.5 },
      { size: 'L', length: 100, waist: 47, hip: 53, hem: 47 },
      { size: 'XL', length: 102, waist: 49, hip: 55, hem: 48.5 },
      { size: '2XL', length: 104, waist: 51, hip: 57, hem: 50 },
    ],
    details: {
      functions: [
        { title: '허리 밴딩 구조', description: '안정적인 착용감으로 운동 중에도 편안함 유지.' },
        { title: '활동성 강화 사이드 슬릿', description: '옆 트임 디테일로 자유로운 움직임 지원.' },
        { title: '빠른 건조력', description: '땀을 빠르게 흡수·건조해 훈련 내내 쾌적함 유지.' },
        { title: '우수한 신축성', description: '프리미엄 기능성 원단으로 어떤 동작도 자유롭게 대응.' },
        { title: '사이드 지퍼 포켓', description: '키·카드 등 소지품을 안전하게 수납.' },
        { title: '뒷면 행거 루프', description: '실용적인 행거 루프로 보관과 정리가 편리.' },
        { title: '빛반사 디테일', description: '스카치 로고와 측면 반사 패치로 야간 시인성 강화.' },
      ],
      design: [
        { title: '앞뒤 언밸런스 기장', description: '입체적인 핏과 세련된 실루엣 연출.' },
        { title: '미니멀 테크웨어 무드', description: '심플하면서도 퍼포먼스 감성이 느껴지는 디자인.' },
        { title: '입체 패턴 절개 라인', description: '시각적 볼륨감과 활동성을 동시에 강조.' },
        { title: '옆 트임 디테일', description: '슬릿 디자인으로 실루엣에 포인트 연출.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%. 가볍고 신축성 좋은 프리미엄 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.QUARTER_ZIP_FLEX_BLUE]: {
    id: PRODUCT_IDS.QUARTER_ZIP_FLEX_BLUE,
    slug: PRODUCT_SLUGS.QUARTER_ZIP_FLEX_BLUE,
    name: 'Quarter-Zip Flex (Blue)',
    category: 'training-top',
    comingSoon: true,
    image: '/apparel/training-top/quarter-zip/quarter-zip-flex/blue/1-blue-1.png',
    images: [
      '/apparel/training-top/quarter-zip/quarter-zip-flex/blue/1-blue-1.png',
      '/apparel/training-top/quarter-zip/quarter-zip-flex/blue/2-blue-2.png',
      '/apparel/training-top/quarter-zip/quarter-zip-flex/5-size-chart-5.png',
    ],
    tagline: '편안한 넥라인과 컬러 배색, 슬림한 퍼포먼스 핏으로 활동성과 스타일을 모두 갖춘 쿼터 집업.',
    description:
      'Quarter Zip Flex은 쿼터 집업 넥 구조로 온도 조절이 용이하고, 심플하면서도 활동적인 착용감을 제공하는 퍼포먼스 아이템입니다. 신체 라인을 자연스럽게 잡아주는 슬림핏 실루엣에 라글란 소매 설계를 더해 움직임이 편안하며, 스포츠 웨어에 최적화된 안정적인 핏을 완성합니다. 소매 핑거홀 디테일은 착용감을 높여주고 자유로운 활동성을 돕습니다. 트렌디한 컬러 배색과 빛반사 로고가 더해져, 야간 스포츠 활동 시 시인성을 확보하면서도 세련된 퍼포먼스 웨어 감성을 살렸습니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '쿼터 집업 넥', detail: ' — 온도 조절이 용이한 반집업 디자인' },
      { label: '슬림핏 실루엣', detail: ' — 신체 라인을 잡아주는 퍼포먼스 핏' },
      { label: '라글란 소매 설계', detail: ' — 자연스러운 움직임 지원' },
      { label: '소매 핑거홀', detail: ' — 착용감 향상과 자유로운 활동성' },
      { label: '빛반사 로고', detail: ' — 야간 시인성 확보' },
    ],
    sizeChart: [
      { size: 'M', length: 66, chest: 94, sleeve: 73.5 },
      { size: 'L', length: 68.5, chest: 99, sleeve: 75.5 },
      { size: 'XL', length: 71, chest: 104, sleeve: 78 },
      { size: '2XL', length: 73.5, chest: 109, sleeve: 80.5 },
    ],
    details: {
      functions: [
        { title: '쿼터 집업 넥 구조', description: '온도 조절이 용이한 반집업 디자인으로 실용성과 스타일 동시 확보.' },
        { title: '슬림핏 퍼포먼스 핏', description: '신체 라인을 자연스럽게 잡아주는 안정적인 착용감.' },
        { title: '라글란 소매 설계', description: '어깨와 소매의 자연스러운 연결로 움직임 방해 없음.' },
        { title: '소매 핑거홀', description: '소매 흘러내림 방지, 손등을 가볍게 감싸 편안한 착용감.' },
        { title: '빛반사 로고', description: '야간 스포츠 활동 시 시인성 확보.' },
      ],
      design: [
        { title: '디테일 컬러 배색', description: '트렌디한 컬러 조합으로 퍼포먼스 웨어 감성 강조.' },
        { title: '심플하고 세련된 디자인', description: '일상과 운동 모두에 어울리는 미니멀 무드.' },
      ],
      material: '폴리에스터 90%, 스판덱스 10%. 부드럽고 신축성 좋은 퍼포먼스 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.MOTION_TECH_SHORTS_GRAY]: {
    id: PRODUCT_IDS.MOTION_TECH_SHORTS_GRAY,
    slug: PRODUCT_SLUGS.MOTION_TECH_SHORTS_GRAY,
    name: 'Motion Tech Shorts (Gray)',
    category: 'shorts',
    comingSoon: true,
    image: '/apparel/shorts/training-shorts/motion-training-shorts/gray/1-motion-training-shorts-gray-1.png',
    images: [
      '/apparel/shorts/training-shorts/motion-training-shorts/gray/1-motion-training-shorts-gray-1.png',
      '/apparel/shorts/training-shorts/motion-training-shorts/3-size-chart-3.png',
    ],
    tagline: '언밸런스 기장과 사이드 슬릿, 반사 디테일에 행거 루프까지 더해 실용성과 퍼포먼스를 완성한 테크 쇼츠.',
    description:
      '프리미엄 기능성 원단으로 제작된 Motion Tech Shorts는 가볍고 신축성 좋은 착용감으로 움직임이 많은 일상과 액티브한 활동 모두에 적합한 반바지입니다. 허리 밴딩 구조로 안정적인 착용감을 제공하며, 앞뒤 언밸런스 기장과 사이드 슬릿 디테일이 더해져 입체적이고 세련된 실루엣을 완성합니다. 미니멀한 테크웨어 무드의 디자인에 사이드 지퍼 포켓, 뒷면 행거 루프, 빛반사 스카치 로고와 측면 반사 패치를 적용해 기능성과 디자인 완성도를 모두 높였습니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    sizeChartType: 'shorts',
    features: [
      { label: '허리 밴딩 구조', detail: ' — 안정적인 착용감' },
      { label: '활동성 강화 사이드 슬릿', detail: ' — 자유로운 움직임 지원' },
      { label: '사이드 지퍼 포켓', detail: ' — 소지품 수납과 보안을 동시에' },
      { label: '뒷면 행거 루프', detail: ' — 실용적인 수납 디테일' },
      { label: '빛반사 스카치 로고 + 측면 반사 패치', detail: ' — 야간 시인성 강화' },
    ],
    sizeChart: [
      { size: 'M', length: 98, waist: 45, hip: 51, hem: 45.5 },
      { size: 'L', length: 100, waist: 47, hip: 53, hem: 47 },
      { size: 'XL', length: 102, waist: 49, hip: 55, hem: 48.5 },
      { size: '2XL', length: 104, waist: 51, hip: 57, hem: 50 },
    ],
    details: {
      functions: [
        { title: '허리 밴딩 구조', description: '안정적인 착용감으로 운동 중에도 편안함 유지.' },
        { title: '활동성 강화 사이드 슬릿', description: '옆 트임 디테일로 자유로운 움직임 지원.' },
        { title: '빠른 건조력', description: '땀을 빠르게 흡수·건조해 훈련 내내 쾌적함 유지.' },
        { title: '우수한 신축성', description: '프리미엄 기능성 원단으로 어떤 동작도 자유롭게 대응.' },
        { title: '사이드 지퍼 포켓', description: '키·카드 등 소지품을 안전하게 수납.' },
        { title: '뒷면 행거 루프', description: '실용적인 행거 루프로 보관과 정리가 편리.' },
        { title: '빛반사 디테일', description: '스카치 로고와 측면 반사 패치로 야간 시인성 강화.' },
      ],
      design: [
        { title: '앞뒤 언밸런스 기장', description: '입체적인 핏과 세련된 실루엣 연출.' },
        { title: '미니멀 테크웨어 무드', description: '심플하면서도 퍼포먼스 감성이 느껴지는 디자인.' },
        { title: '입체 패턴 절개 라인', description: '시각적 볼륨감과 활동성을 동시에 강조.' },
        { title: '옆 트임 디테일', description: '슬릿 디자인으로 실루엣에 포인트 연출.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%. 가볍고 신축성 좋은 프리미엄 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.QUARTER_ZIP_FLEX_LIGHT_GREEN]: {
    id: PRODUCT_IDS.QUARTER_ZIP_FLEX_LIGHT_GREEN,
    slug: PRODUCT_SLUGS.QUARTER_ZIP_FLEX_LIGHT_GREEN,
    name: 'Quarter-Zip Flex (Light Green)',
    category: 'training-top',
    comingSoon: true,
    image: '/apparel/training-top/quarter-zip/quarter-zip-flex/light-green/1-light-green-1.png',
    images: [
      '/apparel/training-top/quarter-zip/quarter-zip-flex/light-green/1-light-green-1.png',
      '/apparel/training-top/quarter-zip/quarter-zip-flex/light-green/2-light-green-2.png',
      '/apparel/training-top/quarter-zip/quarter-zip-flex/5-size-chart-5.png',
    ],
    tagline: '편안한 넥라인과 컬러 배색, 슬림한 퍼포먼스 핏으로 활동성과 스타일을 모두 갖춘 쿼터 집업.',
    description:
      'Quarter Zip Flex은 쿼터 집업 넥 구조로 온도 조절이 용이하고, 심플하면서도 활동적인 착용감을 제공하는 퍼포먼스 아이템입니다. 신체 라인을 자연스럽게 잡아주는 슬림핏 실루엣에 라글란 소매 설계를 더해 움직임이 편안하며, 스포츠 웨어에 최적화된 안정적인 핏을 완성합니다. 소매 핑거홀 디테일은 착용감을 높여주고 자유로운 활동성을 돕습니다. 트렌디한 컬러 배색과 빛반사 로고가 더해져, 야간 스포츠 활동 시 시인성을 확보하면서도 세련된 퍼포먼스 웨어 감성을 살렸습니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '쿼터 집업 넥', detail: ' — 온도 조절이 용이한 반집업 디자인' },
      { label: '슬림핏 실루엣', detail: ' — 신체 라인을 잡아주는 퍼포먼스 핏' },
      { label: '라글란 소매 설계', detail: ' — 자연스러운 움직임 지원' },
      { label: '소매 핑거홀', detail: ' — 착용감 향상과 자유로운 활동성' },
      { label: '빛반사 로고', detail: ' — 야간 시인성 확보' },
    ],
    sizeChart: [
      { size: 'M', length: 66, chest: 94, sleeve: 73.5 },
      { size: 'L', length: 68.5, chest: 99, sleeve: 75.5 },
      { size: 'XL', length: 71, chest: 104, sleeve: 78 },
      { size: '2XL', length: 73.5, chest: 109, sleeve: 80.5 },
    ],
    details: {
      functions: [
        { title: '쿼터 집업 넥 구조', description: '온도 조절이 용이한 반집업 디자인으로 실용성과 스타일 동시 확보.' },
        { title: '슬림핏 퍼포먼스 핏', description: '신체 라인을 자연스럽게 잡아주는 안정적인 착용감.' },
        { title: '라글란 소매 설계', description: '어깨와 소매의 자연스러운 연결로 움직임 방해 없음.' },
        { title: '소매 핑거홀', description: '소매 흘러내림 방지, 손등을 가볍게 감싸 편안한 착용감.' },
        { title: '빛반사 로고', description: '야간 스포츠 활동 시 시인성 확보.' },
      ],
      design: [
        { title: '디테일 컬러 배색', description: '트렌디한 컬러 조합으로 퍼포먼스 웨어 감성 강조.' },
        { title: '심플하고 세련된 디자인', description: '일상과 운동 모두에 어울리는 미니멀 무드.' },
      ],
      material: '폴리에스터 90%, 스판덱스 10%. 부드럽고 신축성 좋은 퍼포먼스 기능성 원단.',
    },
  },

  [PRODUCT_SLUGS.CROSS_C_TAPING_BLACK]: {
    id: PRODUCT_IDS.CROSS_C_TAPING_BLACK,
    slug: PRODUCT_SLUGS.CROSS_C_TAPING_BLACK,
    name: 'Cross C Taping (Black)',
    category: 'taping',
    comingSoon: true,
    image: '/apparel/cross-c-taping/black/1-Black Cross C Taping.png',
    images: [
      '/apparel/cross-c-taping/black/1-Black Cross C Taping.png',
      '/apparel/cross-c-taping/black/2-Black Cross C Taping2.png',
    ],
    tagline: '프리미엄 코튼 원단과 톱니형 절개 구조로 손쉽게 사용할 수 있는 손목·발목 고정 테이핑.',
    description:
      '프리미엄 코튼 원단을 사용해 부드럽고 피부 친화적인 착용감을 제공하는 C 테이핑입니다. 톱니형 구조로 손쉽게 뜯어 사용할 수 있어 편리하며, 오래 착용해도 자극이 적어 안정적인 사용이 가능합니다. 손목 및 발목 고정용으로 활용하기 좋으며, 운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 사용할 수 있습니다.',
    sizes: ['ONE SIZE'],
    features: [
      { label: '프리미엄 코튼 원단', detail: ' — 부드럽고 피부 친화적인 사용감' },
      { label: '톱니형 절개 구조', detail: ' — 손쉽게 뜯어 사용' },
      { label: '오래 착용해도 자극이 적은 편안함' },
      { label: '손목 및 발목 고정용 활용' },
    ],
    sizeChart: [],
    details: {
      functions: [
        { title: '프리미엄 코튼 원단', description: '부드럽고 피부 친화적인 착용감 제공.' },
        { title: '톱니형 절개 구조', description: '손쉽게 뜯어 사용할 수 있어 편리함.' },
        { title: '저자극 장시간 착용', description: '오래 착용해도 자극이 적어 안정적인 사용 가능.' },
        { title: '손목·발목 고정', description: '운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 활용.' },
      ],
      design: [
        { title: '블랙 컬러 포인트', description: '깔끔한 블랙 컬러로 스포츠 테이핑 특유의 강한 인상 연출.' },
        { title: '십자가 C 로고 디테일', description: '실용성과 안정감을 살린 브로스픽 아이덴티티 디자인.' },
      ],
      material: '코튼. 가로 3.8cm × 길이 7m.',
    },
  },

  [PRODUCT_SLUGS.CROSS_C_TAPING_GOLD]: {
    id: PRODUCT_IDS.CROSS_C_TAPING_GOLD,
    slug: PRODUCT_SLUGS.CROSS_C_TAPING_GOLD,
    name: 'Cross C Taping (Gold)',
    category: 'taping',
    comingSoon: true,
    image: '/apparel/cross-c-taping/gold/3-Gold Cross C Taping.png',
    images: [
      '/apparel/cross-c-taping/gold/3-Gold Cross C Taping.png',
      '/apparel/cross-c-taping/gold/4-Gold Cross C Taping2.png',
    ],
    tagline: '프리미엄 코튼 원단과 톱니형 절개 구조로 손쉽게 사용할 수 있는 손목·발목 고정 테이핑.',
    description:
      '프리미엄 코튼 원단을 사용해 부드럽고 피부 친화적인 착용감을 제공하는 C 테이핑입니다. 톱니형 구조로 손쉽게 뜯어 사용할 수 있어 편리하며, 오래 착용해도 자극이 적어 안정적인 사용이 가능합니다. 손목 및 발목 고정용으로 활용하기 좋으며, 운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 사용할 수 있습니다.',
    sizes: ['ONE SIZE'],
    features: [
      { label: '프리미엄 코튼 원단', detail: ' — 부드럽고 피부 친화적인 사용감' },
      { label: '톱니형 절개 구조', detail: ' — 손쉽게 뜯어 사용' },
      { label: '오래 착용해도 자극이 적은 편안함' },
      { label: '손목 및 발목 고정용 활용' },
    ],
    sizeChart: [],
    details: {
      functions: [
        { title: '프리미엄 코튼 원단', description: '부드럽고 피부 친화적인 착용감 제공.' },
        { title: '톱니형 절개 구조', description: '손쉽게 뜯어 사용할 수 있어 편리함.' },
        { title: '저자극 장시간 착용', description: '오래 착용해도 자극이 적어 안정적인 사용 가능.' },
        { title: '손목·발목 고정', description: '운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 활용.' },
      ],
      design: [
        { title: '골드 컬러 포인트', description: '고급스러운 골드 컬러로 스포츠 테이핑 특유의 강한 인상 연출.' },
        { title: '십자가 C 로고 디테일', description: '실용성과 안정감을 살린 브로스픽 아이덴티티 디자인.' },
      ],
      material: '코튼. 가로 3.8cm × 길이 9.1m.',
    },
  },

  [PRODUCT_SLUGS.PHILIPPIANS_413_C_TAPING]: {
    id: PRODUCT_IDS.PHILIPPIANS_413_C_TAPING,
    slug: PRODUCT_SLUGS.PHILIPPIANS_413_C_TAPING,
    name: 'Philippians 4:13 C Taping',
    category: 'taping',
    comingSoon: true,
    image: '/apparel/cross-c-taping/Philippians-4-13/1-Philippians 4_13 C Taping 2.png',
    images: [
      '/apparel/cross-c-taping/Philippians-4-13/1-Philippians 4_13 C Taping 2.png',
      '/apparel/cross-c-taping/Philippians-4-13/2-Philippians 4_13 C Taping 2.png',
    ],
    tagline: '프리미엄 코튼 원단과 톱니형 절개 구조로 손쉽게 사용할 수 있는 손목·발목 고정 테이핑.',
    description:
      '프리미엄 코튼 원단을 사용해 부드럽고 피부 친화적인 착용감을 제공하는 C 테이핑입니다. 톱니형 구조로 손쉽게 뜯어 사용할 수 있어 편리하며, 오래 착용해도 자극이 적어 안정적인 사용이 가능합니다. 손목 및 발목 고정용으로 활용하기 좋으며, 운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 사용할 수 있습니다.',
    sizes: ['ONE SIZE'],
    features: [
      { label: '프리미엄 코튼 원단', detail: ' — 부드럽고 피부 친화적인 사용감' },
      { label: '톱니형 절개 구조', detail: ' — 손쉽게 뜯어 사용' },
      { label: '오래 착용해도 자극이 적은 편안함' },
      { label: '손목 및 발목 고정용 활용' },
    ],
    sizeChart: [],
    details: {
      functions: [
        { title: '프리미엄 코튼 원단', description: '부드럽고 피부 친화적인 착용감 제공.' },
        { title: '톱니형 절개 구조', description: '손쉽게 뜯어 사용할 수 있어 편리함.' },
        { title: '저자극 장시간 착용', description: '오래 착용해도 자극이 적어 안정적인 사용 가능.' },
        { title: '손목·발목 고정', description: '운동 전후 테이핑이 필요한 다양한 상황에서 실용적으로 활용.' },
      ],
      design: [
        { title: '메시지성 디자인', description: '빌립보서 4:13 메시지와 십자가 모티브가 조화를 이루는 포인트 디자인.' },
        { title: '스포츠 테이핑 무드', description: '실용성과 안정감을 살린 강한 인상의 디자인.' },
      ],
      material: '코튼. 가로 5cm × 길이 7m.',
    },
  },

  [PRODUCT_SLUGS.MOTION_TECH_PANTS_BLACK]: {
    id: PRODUCT_IDS.MOTION_TECH_PANTS_BLACK,
    slug: PRODUCT_SLUGS.MOTION_TECH_PANTS_BLACK,
    name: 'Motion Tech Pants (Black)',
    category: 'pants',
    comingSoon: true,
    image: '/apparel/pants/traning-pants/motion-training-pants/black/1-motion-tech-training-pants-black-1.png',
    images: [
      '/apparel/pants/traning-pants/motion-training-pants/black/1-motion-tech-training-pants-black-1.png',
      '/apparel/pants/traning-pants/motion-training-pants/3-motion-tech-trianing-pants-3.png',
      '/apparel/pants/traning-pants/motion-training-pants/4-motion-tech-trianing-pants-4.png',
      '/apparel/pants/traning-pants/motion-training-pants/5-motion-tech-trianing-pants-5.png',
      '/apparel/pants/traning-pants/motion-training-pants/6-motion-tech-trianing-pants-6.png',
      '/apparel/pants/traning-pants/motion-training-pants/7-motion-tech-trianing-pants-7.png',
    ],
    tagline: '프리미엄 기능성 원단과 뛰어난 신축성, 빠른 건조력으로 어떤 운동에서도 완성도 높은 핏을 구현한 테크 팬츠.',
    description:
      'Motion Tech Pants는 러닝과 트레이닝에 최적화된 구조로 설계된 퍼포먼스 팬츠입니다. 슬림 테이퍼드 핏이 하체 라인을 자연스럽고 깔끔하게 잡아주며, 활동성을 고려한 입체 패턴이 더해져 움직임이 많은 상황에서도 편안한 착용감을 제공합니다. 프리미엄 기능성 원단은 가볍고 유연하며, 우수한 신축성과 빠른 건조력을 갖춰 다양한 스포츠 활동에 적합합니다. 빛반사 스카치 로고 디테일은 야간 시인성을 높이고, 퍼포먼스 감성을 한층 강조해줍니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '슬림 테이퍼드 핏', detail: ' — 하체 라인을 자연스럽게 정돈' },
      { label: '입체 패턴 설계', detail: ' — 활동성을 고려한 구조' },
      { label: '우수한 신축성', detail: ' + 빠른 건조력' },
      { label: '빛반사 스카치 로고', detail: ' — 야간 시인성 확보' },
    ],
    sizeChartType: 'pants',
    sizeChart: [
      { size: 'M',   length: 95,  hip: 103, waist: 75, rise: 28, hem: 26 },
      { size: 'L',   length: 97,  hip: 107, waist: 78, rise: 29, hem: 27 },
      { size: 'XL',  length: 99,  hip: 111, waist: 81, rise: 30, hem: 28 },
      { size: '2XL', length: 101, hip: 115, waist: 83, rise: 31, hem: 29 },
    ],
    details: {
      functions: [
        { title: '슬림 테이퍼드 핏', description: '하체 라인을 자연스럽고 깔끔하게 잡아주는 실루엣.' },
        { title: '입체 패턴 설계', description: '활동성을 고려한 구조로 움직임이 많은 상황에서도 편안한 착용감 제공.' },
        { title: '프리미엄 기능성 원단', description: '가볍고 유연하며 우수한 신축성과 빠른 건조력을 갖춘 원단.' },
        { title: '멀티 스포츠 활용', description: '러닝, 트레이닝 등 다양한 스포츠 활동에 최적화된 구조.' },
        { title: '빛반사 스카치 로고', description: '야간 시인성을 높이고 퍼포먼스 감성을 강조하는 디테일.' },
      ],
      design: [
        { title: '슬림 테이퍼드 실루엣', description: '몸에 밀착되면서도 편안한, 핏 완성도 높은 퍼포먼스 팬츠.' },
        { title: '테크웨어 무드', description: '스포티하면서도 깔끔한 스타일.' },
        { title: '반사 디테일', description: '포인트 디자인으로 완성한 야간 가시성.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%.',
    },
  },

  [PRODUCT_SLUGS.MOTION_TECH_PANTS_GRAY]: {
    id: PRODUCT_IDS.MOTION_TECH_PANTS_GRAY,
    slug: PRODUCT_SLUGS.MOTION_TECH_PANTS_GRAY,
    name: 'Motion Tech Pants (Gray)',
    category: 'pants',
    comingSoon: true,
    image: '/apparel/pants/traning-pants/motion-training-pants/gray/1-motion-tech-traning-pants-gray-1.png',
    images: [
      '/apparel/pants/traning-pants/motion-training-pants/gray/1-motion-tech-traning-pants-gray-1.png',
      '/apparel/pants/traning-pants/motion-training-pants/3-motion-tech-trianing-pants-3.png',
      '/apparel/pants/traning-pants/motion-training-pants/4-motion-tech-trianing-pants-4.png',
      '/apparel/pants/traning-pants/motion-training-pants/5-motion-tech-trianing-pants-5.png',
      '/apparel/pants/traning-pants/motion-training-pants/6-motion-tech-trianing-pants-6.png',
      '/apparel/pants/traning-pants/motion-training-pants/7-motion-tech-trianing-pants-7.png',
    ],
    tagline: '프리미엄 기능성 원단과 뛰어난 신축성, 빠른 건조력으로 어떤 운동에서도 완성도 높은 핏을 구현한 테크 팬츠.',
    description:
      'Motion Tech Pants는 러닝과 트레이닝에 최적화된 구조로 설계된 퍼포먼스 팬츠입니다. 슬림 테이퍼드 핏이 하체 라인을 자연스럽고 깔끔하게 잡아주며, 활동성을 고려한 입체 패턴이 더해져 움직임이 많은 상황에서도 편안한 착용감을 제공합니다. 프리미엄 기능성 원단은 가볍고 유연하며, 우수한 신축성과 빠른 건조력을 갖춰 다양한 스포츠 활동에 적합합니다. 빛반사 스카치 로고 디테일은 야간 시인성을 높이고, 퍼포먼스 감성을 한층 강조해줍니다.',
    sizes: ['M', 'L', 'XL', '2XL'],
    features: [
      { label: '슬림 테이퍼드 핏', detail: ' — 하체 라인을 자연스럽게 정돈' },
      { label: '입체 패턴 설계', detail: ' — 활동성을 고려한 구조' },
      { label: '우수한 신축성', detail: ' + 빠른 건조력' },
      { label: '빛반사 스카치 로고', detail: ' — 야간 시인성 확보' },
    ],
    sizeChartType: 'pants',
    sizeChart: [
      { size: 'M',   length: 95,  hip: 103, waist: 75, rise: 28, hem: 26 },
      { size: 'L',   length: 97,  hip: 107, waist: 78, rise: 29, hem: 27 },
      { size: 'XL',  length: 99,  hip: 111, waist: 81, rise: 30, hem: 28 },
      { size: '2XL', length: 101, hip: 115, waist: 83, rise: 31, hem: 29 },
    ],
    details: {
      functions: [
        { title: '슬림 테이퍼드 핏', description: '하체 라인을 자연스럽고 깔끔하게 잡아주는 실루엣.' },
        { title: '입체 패턴 설계', description: '활동성을 고려한 구조로 움직임이 많은 상황에서도 편안한 착용감 제공.' },
        { title: '프리미엄 기능성 원단', description: '가볍고 유연하며 우수한 신축성과 빠른 건조력을 갖춘 원단.' },
        { title: '멀티 스포츠 활용', description: '러닝, 트레이닝 등 다양한 스포츠 활동에 최적화된 구조.' },
        { title: '빛반사 스카치 로고', description: '야간 시인성을 높이고 퍼포먼스 감성을 강조하는 디테일.' },
      ],
      design: [
        { title: '슬림 테이퍼드 실루엣', description: '몸에 밀착되면서도 편안한, 핏 완성도 높은 퍼포먼스 팬츠.' },
        { title: '테크웨어 무드', description: '스포티하면서도 깔끔한 스타일.' },
        { title: '반사 디테일', description: '포인트 디자인으로 완성한 야간 가시성.' },
      ],
      material: '폴리에스터 92%, 스판덱스 8%.',
    },
  },
};

// 목록 페이지용 간략 상품 리스트
// hideFromList: true 상품은 제외 (다른 상품의 variant 카드로 표시됨)
//
// ✅ 상품 출시 시 체크리스트 (예: Quarter-Zip Training Top 출시):
//   1. 해당 상품의 comingSoon: true 로 변경
//   2. hideFromList: true 인 variant 상품도 comingSoon: true + hideFromList 제거
//   3. Supabase product_sizes 테이블에 재고 입력
export const productList = Object.values(products)
  .filter((p) => !p.hideFromList)
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    description: p.tagline,
    category: p.category,
    comingSoon: p.comingSoon ?? false,
    variants: p.variants,
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
