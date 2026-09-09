/**
 * 부츠스킨 컬렉션 페이지·홈 프로모션 섹션이 공유하는 콘텐츠 상수.
 * 상품 데이터(가격·사이즈)는 lib/products.ts와 Supabase에서 오고,
 * 여기에는 카피와 이미지 배치 정보만 둔다.
 */
import { products, PRODUCT_SLUGS } from '@/lib/products';

const ASSET_ROOT = '/apparel/bootskin';

/**
 * scripts/gen-bootskin-overlay.mjs가 prebuild에서 만드는 투명 스티커 폴더.
 * gitignore 대상이라 dev에서는 `npm run gen-bootskin`을 먼저 돌려야 보인다.
 * next/image 커스텀 로더가 참조하는 /_opt 사전 생성물이 없으므로 여기 이미지는 <img>로 쓴다.
 */
const OVERLAY_ROOT = '/_bootskin';

export const BOOTSKIN_BEFORE_AFTER = {
  before: `${ASSET_ROOT}/BootSkinLabel/bootskin-label-before.png`,
  after: `${ASSET_ROOT}/BootSkinLabel/bootskin-label-after.png`,
};

/**
 * 홈 프로모션 섹션에 노출할 대표 스티커 샘플.
 * 커스텀을 뺀 미리보기 8개 그룹과 1:1로 맞춘다 — 그룹이 늘면 여기도 같이 늘려야
 * "이게 전부"라는 신호가 깨지지 않는다. 라벨은 GROUP_SPECS와 같은 말을 쓴다.
 *
 * 이미지는 상품 원본이 아니라 생성기가 만든 투명본(OVERLAY_ROOT)을 쓴다.
 * 원본 900x900은 대부분 여백이고 하단에 "가로: N mm" 캡션까지 인쇄돼 있어,
 * 56px 칩에 넣으면 스티커가 점만 하게 보이고 캡션 글씨가 지저분하게 남는다.
 * 투명본은 잉크 경계로 잘려 있어 칩을 꽉 채운다.
 * 56px에서 뭉개지지 않도록 글자가 짧은 아트웍으로 고른다.
 */
export const BOOTSKIN_SAMPLES = [
  { label: '번호', image: `${OVERLAY_ROOT}/number/1.png` },
  { label: '이니셜', image: `${OVERLAY_ROOT}/initial/J.png` },
  { label: '국기', image: `${OVERLAY_ROOT}/nation/KOREA.png` },
  { label: '가족', image: `${OVERLAY_ROOT}/family/DAD.png` },
  { label: '종교', image: `${OVERLAY_ROOT}/faith-symbol/CROSS.png` },
  { label: '심볼', image: `${OVERLAY_ROOT}/symbol/world-cup-trophy.png` },
  { label: '포지션', image: `${OVERLAY_ROOT}/position/ST.png` },
  { label: '문구', image: `${OVERLAY_ROOT}/motivation/GLORY.png` },
] as const;

/* ===================== 축구화 미리보기 ===================== */

/**
 * 스티커를 얹을 좌표. 실제 촬영본(bootskin-label-after.png)과
 * 원본(before)의 픽셀 차이를 측정해 얻은 값이라 실물 부착 위치와 같다.
 * 값은 축구화 사진 대비 비율(0~1)이다.
 *
 * mmScale은 스티커 1mm가 사진 높이(1086px)에서 차지하는 비율이다.
 * 촬영본에 실제로 붙어 있는 스티커를 재서 구했다 —
 * 뒤꿈치 십자가(세로 10mm)가 69px, 갑피 이니셜(세로 6mm)이 39px.
 * 갑피는 면이 카메라에서 비껴 있어 같은 mm라도 작게 찍히므로 슬롯마다 값이 다르다.
 */
export const PREVIEW_SLOTS = {
  /** 갑피 — 국기·이니셜·번호가 가로로 나란히 붙는 자리 */
  front: { left: 0.339, top: 0.396, gap: 0.012, mmScale: 0.00598 },
  /** 뒤꿈치 — 심볼·종교 스티커 자리 */
  heel: { left: 0.073, top: 0.496, gap: 0.012, mmScale: 0.00635 },
} as const;

export type PreviewSlot = keyof typeof PREVIEW_SLOTS;

/** 스티커 실측 크기 [가로mm, 세로mm] */
export type StickerMm = readonly [number, number];

/**
 * 캡션의 두 값 중 어느 쪽을 믿고 그릴지.
 *
 * 캡션의 가로는 0.5mm 단위로 반올림돼 있어 아트웍 비율과 최대 0.5mm 어긋난다.
 * - `height` — 세로만 맞추고 가로는 아트웍 비율에 맡긴다. 번호·이니셜처럼
 *   여러 장을 나란히 붙이는 글자는 높이가 같아야 하므로 이쪽이다.
 *   (예: K는 6mm 높이면 가로가 5.46mm 필요한데 캡션은 5mm다. 상자에 맞추면
 *   K만 5.49mm로 줄어 KDB가 들쭉날쭉해진다.)
 * - `box` — 가로·세로 상자 안에 맞춘다. GLORY TO GOD(33×4mm)처럼 가로로 긴
 *   문구가 뒤꿈치를 벗어나지 않게 막아준다. 한 번에 한 장만 붙는 그룹용이다.
 */
export type StickerFit = 'height' | 'box';

/**
 * 흰 바탕이 디자인의 일부인 스티커용 받침판.
 *
 * 오버레이 생성기는 흰색을 투명으로 바꾼다. 검은 글리프에는 맞지만 태극기처럼
 * 흰 바탕이 디자인인 경우 괘와 태극만 남아 공중에 뜬 것처럼 보인다.
 * 그래서 실제 깃면 크기의 흰 판을 뒤에 깔아준다.
 */
export interface StickerPlate {
  mm: StickerMm;
  /** 원형 배지는 모서리를 둥글린다 */
  round?: boolean;
}

export interface PreviewOption {
  /** 상품 상세의 옵션 값과 동일한 문자열 */
  value: string;
  /** 미리보기에 얹을 투명 스티커 (scripts/gen-bootskin-overlay.mjs 생성물) */
  overlay: string;
  /** 이 스티커의 실측 크기 */
  mm: StickerMm;
  plate?: StickerPlate;
}

export interface PreviewGroup {
  key: string;
  label: string;
  /** 이 그룹을 담당하는 상품 slug */
  slug: string;
  /** 장바구니·재고 조회 키 (products.id) */
  productId: number;
  productName: string;
  /** 장바구니에 담길 때 쓸 대표 이미지 */
  thumbnail: string;
  slot: PreviewSlot;
  /** 블랙/화이트 두 벌이 있는 그룹인지 */
  toned: boolean;
  /** 한 번에 고를 수 있는 개수. 이니셜·번호는 여러 장을 나란히 붙인다 */
  maxPicks: number;
  fit: StickerFit;
  options: PreviewOption[];
}

/**
 * 옵션 값 → 스티커 파일 매핑.
 *
 * 상품의 sizeImages를 그대로 쓸 수 없다. 일부 옵션(종교 등)은 목록용으로
 * 실착 사진(`*-detail.png`)을 가리키고 있어 축구화 위에 얹을 수 없기 때문이다.
 * 그래서 각 그룹의 sizes 순서에 맞춰 실제 스티커 파일명을 여기에 명시한다.
 *
 * 파일명은 scripts/gen-bootskin-overlay.mjs가 원본의 순번을 떼고 정규화한 이름이다.
 */
type FileResolver = (value: string, index: number, tone: 'Black' | 'White') => string;

/** 번호·이니셜은 값 그대로가 파일명이다 (7.png / W-white.png) */
const tonedFile: FileResolver = (value, _index, tone) =>
  `${value}${tone === 'White' ? '-white' : ''}.png`;

const NATION_FILES = ['KOREA.png', 'nation-flag.png', 'nation-flag-circle.png', 'BRAZIL.png'];
const FAMILY_FILES = ['DAD.png', 'MOM.png', 'FAMILY.png'];
const POSITION_FILES = ['ST.png', 'FW.png', 'GK.png', 'CB.png', 'SB.png', 'MF.png', 'RW.png', 'LW.png'];
const MOTIVATION_FILES = [
  'AURA.png',
  'CHAMPION.png',
  'WINNER.png',
  'GLORY.png',
  'NO-PAIN-NO-GAIN.png',
  'ALL-IN.png',
  'KEEP-GOING.png',
  'NEVER-GIVE-UP.png',
  'MINDSET.png',
  'READY.png',
  'FOCUS.png',
];
const FAITH_FILES = [
  'CROSS.png',
  'JESUS.png',
  'PHIL-4-13.png',
  '100--JESUS.png',
  'GOD.png',
  'BELEVE.png',
  'GLORY-TO-GOD.png',
  'LORD-IS-ALWAYS-WITH-YOU.png',
  'THANK-GOD.png',
  'GOD-IS-FAITHFUL.png',
];
/**
 * 옵션별 실측 크기 [가로mm, 세로mm].
 *
 * 상품 원본 이미지(public/apparel/bootskin/<종류>/*.png) 하단에 인쇄된
 * "가로: N mm / 세로: N mm" 캡션을 그대로 옮긴 값이다. 눈대중이 아니므로
 * 화면을 보며 임의로 조정하지 말 것 — 크기가 달라 보이면 슬롯의 mmScale을 만진다.
 * 블랙·화이트·컬러 변형은 모두 같은 크기로 인쇄된다.
 */
const NUMBER_MM: Record<string, StickerMm> = {
  '0': [5, 6], '1': [3, 6], '2': [4.5, 6], '3': [4.5, 6], '4': [5.5, 6],
  '5': [4.5, 6], '6': [4.5, 6], '7': [4.5, 6], '8': [5, 6], '9': [4.5, 6],
};

const INITIAL_MM: Record<string, StickerMm> = {
  A: [6, 6], B: [4.5, 6], C: [4.5, 6], D: [5, 6], E: [4, 6], F: [4, 6], G: [5, 6],
  H: [5, 6], I: [1.5, 6], J: [4.5, 6], K: [5, 6], L: [4, 6], M: [6.5, 6], N: [5, 6],
  O: [5, 6], P: [5, 6], Q: [4, 6], R: [5, 6], S: [4.5, 6], T: [4.5, 6], U: [4.5, 6],
  V: [5.5, 6], W: [8, 6], X: [5.5, 6], Y: [5.5, 6], Z: [4.5, 6],
};

const NATION_MM: Record<string, StickerMm> = {
  KOREA: [17, 5],
  '태극기': [10, 7.5],
  '태극기 원형': [10, 10],
  '브라질': [10, 7.5],
};

/**
 * 태극기의 흰 깃면 크기. 캡션의 10×7.5mm는 괘 끝에서 끝까지(잉크)라 깃면보다 작다.
 *
 * 국기 규격(깃면 가로:세로 = 3:2, 태극 지름 = 깃면 가로의 1/3)에 아트웍의 태극
 * 지름 4.8mm를 넣어 14.4×9.6mm를 얻었다. 촬영본에 붙은 실물 깃면을 재도 14.5mm라
 * 서로 맞는다. 원형 배지는 검은 테두리 원이 곧 경계라 캡션 크기 그대로다.
 */
const NATION_PLATES: Record<string, StickerPlate> = {
  '태극기': { mm: [14.4, 9.6] },
  '태극기 원형': { mm: [10, 10], round: true },
};

/**
 * 포지션·모티베이션·이모지 심볼은 캡션에 한 변만 인쇄돼 있다.
 * (포지션·모티베이션은 가로만, 이모지는 세로만)
 *
 * 빠진 변은 눈대중이 아니라 원본의 잉크 경계 상자 비율로 구했다 —
 * 캡션에 있는 변 ÷ (잉크 가로 ÷ 잉크 세로). 소수 첫째 자리에서 반올림했다.
 * 아트웍이 교체되면 비율이 달라지므로 이 표도 다시 재야 한다.
 */

/** 포지션은 전부 가로 10mm로 인쇄된다. 글자 수가 같아도 자폭이 달라 세로가 제각각이다 */
const POSITION_MM: Record<string, StickerMm> = {
  ST: [10, 6], FW: [10, 5.1], GK: [10, 5.6], CB: [10, 5.8],
  SB: [10, 5.9], MF: [10, 5.4], RW: [10, 4.8], LW: [10, 5],
};

const MOTIVATION_MM: Record<string, StickerMm> = {
  AURA: [13, 2.9],
  CHAMPION: [24, 3.4],
  WINNER: [19, 3.4],
  GLORY: [17, 3.6],
  'NO PAIN NO GAIN': [33, 3],
  'ALL IN': [15, 3.1],
  'KEEP GOING': [28, 3.4],
  'NEVER GIVE UP': [28, 2.8],
  MINDSET: [21, 3.5],
  READY: [17, 3.8],
  FOCUS: [17, 3.6],
};

const FAMILY_MM: Record<string, StickerMm> = {
  DAD: [10.9, 4],
  MOM: [13, 4],
  FAMILY: [19.6, 4],
};

const FAITH_MM: Record<string, StickerMm> = {
  CROSS: [6, 10],
  JESUS: [17, 5],
  'PHIL 4:13': [23, 5],
  '100% JESUS': [28, 4],
  GOD: [10.8, 4],
  BELEVE: [22, 4],
  'GLORY TO GOD': [33, 4],
  'LORD IS ALWAYS WITH YOU': [33, 8],
  'THANK GOD': [20, 3],
  'GOD IS FAITHFUL': [33, 3],
};

const SYMBOL_MM: Record<string, StickerMm> = {
  '⚡-black': [7.5, 10], '⚡-color': [7.5, 10], '⚡-white': [7.5, 10],
  '👑-black': [15, 10], '👑-white': [15, 10],
  '🤍-white': [11, 10], '❤️-black': [11, 10],
  '🙏-color': [8.7, 10], '🙏-white': [8.7, 10],
  '🔥-color': [7, 8.5], '🔥-white': [7, 8.5],
  '⭐-color': [10.5, 10], '⭐-black': [10.5, 10], '⭐-white': [10.5, 10],
  '🏆-color': [6, 15],
  'GOAT-black': [13.5, 4.5],
  // 이모지는 전부 세로 8.5mm로 인쇄된다 (가로는 아트웍 비율에서 유도)
  '😶‍🌫️-color': [8.5, 8.5], '🥵-color': [8.4, 8.5], '😈-color': [8.9, 8.5],
  '🫡-color': [9.2, 8.5], '🤩-color': [9.3, 8.5], '🤫-color': [7.9, 8.5],
  '😡-color': [8.7, 8.5], '🥶-color': [7.8, 8.5], '🥱-color': [8.4, 8.5],
  '🤭-color': [8.4, 8.5], '☠️-color': [9.4, 8.5], '👽-color': [7.9, 8.5],
  '👻-color': [9.9, 8.5],
};

const SYMBOL_FILES = [
  'lightning-black.png',
  'lightning-color.png',
  'lightning-white.png',
  'crown-black.png',
  'crown-white.png',
  'heart-white.png',
  'heart-black.png',
  'pray-color.png',
  'pray-white.png',
  'fire-color.png',
  'fire-white.png',
  'star-color.png',
  'star-black.png',
  'star-white.png',
  'world-cup-trophy.png',
  'GOAT.png',
  'cloud-face.png',
  'hot-face.png',
  'devil.png',
  'salute.png',
  'star-eyes.png',
  'shush.png',
  'angry.png',
  'cold-face.png',
  'yawn.png',
  'hand-over-mouth.png',
  'skull.png',
  'alien.png',
  'ghost.png',
];

/** 표에 빠진 옵션이 있으면 화면에서 조용히 어긋나므로 눈에 띄는 기본값을 쓴다 */
const FALLBACK_MM: StickerMm = [6, 6];

function buildOptions(
  slug: string,
  kind: string,
  files: string[] | FileResolver,
  mm: Record<string, StickerMm>,
  plates: Record<string, StickerPlate> | undefined,
  tone: 'Black' | 'White' = 'Black',
): PreviewOption[] {
  const sizes = products[slug as keyof typeof products]?.sizes ?? [];
  return sizes.map((value, index) => ({
    value,
    overlay: `/_bootskin/${kind}/${typeof files === 'function' ? files(value, index, tone) : files[index]}`,
    mm: mm[value] ?? FALLBACK_MM,
    plate: plates?.[value],
  }));
}

/** 미리보기 탭 구성. 크기는 옵션별 실측 mm(*_MM)에서 오고, 배치는 PREVIEW_SLOTS에서 온다. */
interface GroupSpec {
  key: string;
  label: string;
  slug: string;
  /** public/_bootskin 하위 폴더명 */
  kind: string;
  slot: PreviewSlot;
  toned: boolean;
  maxPicks: number;
  fit: StickerFit;
  files: string[] | FileResolver;
  mm: Record<string, StickerMm>;
  /** 흰 바탕이 디자인인 옵션만 (태극기) */
  plates?: Record<string, StickerPlate>;
}

/** 이니셜은 세 글자(예: KDB), 번호는 두 자리(예: 10)까지 나란히 붙이는 게 보통이다 */
const GROUP_SPECS: GroupSpec[] = [
  { key: 'number', label: '번호', slug: PRODUCT_SLUGS.BOOTSKIN_NUMBER, kind: 'number', slot: 'front', toned: true, maxPicks: 2, fit: 'height', files: tonedFile, mm: NUMBER_MM },
  { key: 'initial', label: '이니셜', slug: PRODUCT_SLUGS.BOOTSKIN_ALPHABET, kind: 'initial', slot: 'front', toned: true, maxPicks: 3, fit: 'height', files: tonedFile, mm: INITIAL_MM },
  { key: 'nation', label: '국기', slug: PRODUCT_SLUGS.BOOTSKIN_KOREA, kind: 'nation', slot: 'front', toned: false, maxPicks: 1, fit: 'box', files: NATION_FILES, mm: NATION_MM, plates: NATION_PLATES },
  { key: 'family', label: '가족', slug: PRODUCT_SLUGS.BOOTSKIN_FAMILY, kind: 'family', slot: 'front', toned: false, maxPicks: 1, fit: 'box', files: FAMILY_FILES, mm: FAMILY_MM },
  { key: 'faith', label: '종교', slug: PRODUCT_SLUGS.BOOTSKIN_SYMBOL, kind: 'faith-symbol', slot: 'heel', toned: false, maxPicks: 1, fit: 'box', files: FAITH_FILES, mm: FAITH_MM },
  { key: 'symbol', label: '심볼', slug: PRODUCT_SLUGS.BOOTSKIN_SYMBOLS, kind: 'symbol', slot: 'heel', toned: false, maxPicks: 1, fit: 'box', files: SYMBOL_FILES, mm: SYMBOL_MM },
  { key: 'position', label: '포지션', slug: PRODUCT_SLUGS.BOOTSKIN_POSITION, kind: 'position', slot: 'front', toned: false, maxPicks: 1, fit: 'box', files: POSITION_FILES, mm: POSITION_MM },
  { key: 'motivation', label: '문구', slug: PRODUCT_SLUGS.BOOTSKIN_MOTIVATION, kind: 'motivation', slot: 'heel', toned: false, maxPicks: 1, fit: 'box', files: MOTIVATION_FILES, mm: MOTIVATION_MM },
];

export function getPreviewGroups(tone: 'Black' | 'White'): PreviewGroup[] {
  return GROUP_SPECS.map((spec) => {
    const product = products[spec.slug as keyof typeof products];
    return {
      key: spec.key,
      label: spec.label,
      slug: spec.slug,
      productId: product.id,
      productName: product.name,
      thumbnail: product.image,
      slot: spec.slot,
      toned: spec.toned,
      maxPicks: spec.maxPicks,
      fit: spec.fit,
      options: buildOptions(spec.slug, spec.kind, spec.files, spec.mm, spec.plates, tone),
    };
  });
}

/** 페이지 진입 시 비어 보이지 않도록 촬영본과 같은 조합을 미리 얹어둔다 */
export const PREVIEW_DEFAULT: Record<string, string[]> = {
  nation: ['태극기'],
  number: ['7'],
  faith: ['CROSS'],
};

/* ===================== 히어로 스탯 ===================== */

/** 값은 넷 다 기호·숫자로 맞춘다. 하나만 한글이면 줄의 리듬이 끊긴다 */
export const BOOTSKIN_STATS = [
  { value: '0-9', label: '번호' },
  { value: 'A-Z', label: '이니셜' },
  { value: '50+', label: '심볼·문구' },
  { value: '100%', label: '방수' },
] as const;

/* ===================== 부착 방법 ===================== */

export const BOOTSKIN_APPLY_STEPS = [
  {
    step: '01',
    title: '표면을 닦는다',
    desc: '붙일 자리의 흙과 기름기를 마른 천으로 깨끗이 닦아냅니다. 표면이 깨끗할수록 접착력이 올라갑니다.',
  },
  {
    step: '02',
    title: '위치를 잡고 붙인다',
    desc: '전사지를 떼어 원하는 위치에 올린 뒤, 가운데부터 바깥쪽으로 밀며 공기를 빼줍니다.',
  },
  {
    step: '03',
    title: '눌러서 밀착시킨다',
    desc: '10초간 고르게 눌러 밀착시키고 전사지를 천천히 벗겨냅니다. 경기 전날 부착해 1~2시간 경화하면 가장 좋습니다.',
  },
] as const;

/* ===================== FAQ ===================== */

/** 답변의 `**강조**` 구간은 BootskinFaq의 renderFaqAnswer가 <strong>으로 바꾼다 */
export interface BootskinFaqItem {
  q: string;
  a: string;
}

export const BOOTSKIN_FAQ: BootskinFaqItem[] = [
  {
    q: 'BOOT SKIN은 일반 스티커나 열전사 필름과 어떻게 다른가요?',
    a: '일반 비닐 스티커는 두껍고 쉽게 들뜨거나 벗겨질 수 있으며, 열전사 필름은 열프레스 장비가 필요합니다. 반면 Boot Skin은 **국내 고급 잉크와 접착 기술**을 사용한 기계로 생산하여 축구화 표면에 자연스럽게 밀착됩니다. **두꺼운 가장자리가 없어** 걸리거나 들뜰 가능성이 적고, **별도의 열 작업 없이** 집에서도 쉽게 부착할 수 있습니다.',
  },
  {
    q: '방수와 날씨 변화에 강한가요?',
    a: '네. Boot Skin은 다양한 환경에서도 안정적으로 유지됩니다. 비나 젖은 환경에서 **완전 방수**, 직사광선에도 색이 쉽게 바래지 않는 **자외선 저항**, **영하 10°C ~ 영상 60°C 온도 안정성**, 마찰과 흠집을 줄여주는 **보호 코팅**, 진흙도 디자인 손상 없이 쉽게 닦아낼 수 있습니다.',
  },
  {
    q: '어떤 축구화 브랜드와 소재에 사용할 수 있나요?',
    a: '**Nike, Adidas, Puma 등 모든 브랜드**의 축구화에 사용 가능하며, **천연 가죽과 합성 가죽 소재 모두**에 적용할 수 있습니다. Boot Skin의 접착 기술은 축구화 표면에 안정적으로 부착되도록 설계되었습니다.',
  },
  {
    q: '어떤 사이즈가 있나요?',
    a: '디자인마다 다릅니다. **번호와 이니셜은 모두 세로 6mm**로 높이가 같아 여러 개를 나란히 붙여도 줄이 맞습니다. **포지션은 모두 가로 10mm**로 폭이 같습니다. 국기·가족·종교·심볼·문구는 디자인에 따라 **세로 2.8~15mm, 가로 6~33mm** 사이입니다. 각 옵션 이미지에 **치수가 mm로 인쇄**되어 있으니 주문 전에 확인하실 수 있습니다.',
  },
  {
    q: '부착 후 바로 경기해도 되나요?',
    a: '바로 사용할 수는 있지만, 최대 접착력을 위해 **1~2시간 경화 시간**을 권장합니다. 가장 좋은 결과를 위해 **경기 전날 부착**하는 것을 추천합니다.',
  },
  {
    q: '얼마나 오래 지속되나요?',
    a: '올바르게 부착된 Boot Skin은 정기적인 플레이 기준 **여러 시즌**, **200시간 이상**의 경기 사용, **300회 이상**의 훈련 세션을 견딜 수 있습니다. 저가형 제품과는 다른 내구성을 제공합니다.',
  },
  {
    q: '경기 중 손상되면 어떻게 되나요?',
    a: 'Boot Skin은 **슬라이딩 태클·축구화 간 접촉**, **인조잔디 마찰**, **스터드 자국과 스크래치**, **강한 볼 임팩트**에도 견딜 수 있도록 제작되었습니다.',
  },
  {
    q: '카탈로그에 없는 맞춤 디자인도 제작할 수 있나요?',
    a: '물론입니다. 원하시는 로고 파일이나 팀 로고를 보내주시면 제작 가능 여부를 확인해 드립니다. 맞춤 디자인은 제작 처리 기간이 **2~3일 추가**됩니다.',
  },
  {
    q: '팀 주문이나 대량 구매 할인도 제공하나요?',
    a: '네. 팀 주문 및 도매 가격 문의는 이메일 또는 인스타그램 DM으로 직접 연락해 주세요. BROSPICK은 팀 전체의 아이덴티티 표현을 돕는 것을 좋아하며, **대량 주문 시 특별 가격**을 제공합니다.',
  },
];
