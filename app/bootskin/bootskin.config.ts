/**
 * 부츠스킨 컬렉션 페이지·홈 프로모션 섹션이 공유하는 콘텐츠 상수.
 * 상품 데이터(가격·사이즈)는 lib/products.ts와 Supabase에서 오고,
 * 여기에는 카피와 이미지 배치 정보만 둔다.
 */
import { products, PRODUCT_SLUGS } from '@/lib/products';
import { getStickerProduct, resolveSticker } from '@/lib/bootskin-stickers';

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
  /** 스티커 값. 색을 바꿔도 같은 스티커면 같은 값이다 */
  value: string;
  /** 장바구니·재고·주문 항목이 공유하는 옵션 문자열 (`7 — Black`, `CROSS — White`, `GOD`) */
  optionValue: string;
  /** 화이트 아트웍인지 — 밝은 바탕에서는 윤곽이나 어두운 칩이 필요하다 */
  light: boolean;
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
  /** 블랙/화이트를 고를 수 있는 그룹인지 (일부 스티커만 화이트가 있어도 해당) */
  toned: boolean;
  /** 한 번에 고를 수 있는 개수. 이니셜·번호는 여러 장을 나란히 붙인다 */
  maxPicks: number;
  fit: StickerFit;
  options: PreviewOption[];
}

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

/** 매니페스트에 mm가 없는 옵션(캡션 판독 실패)은 화면에서 조용히 어긋나므로 눈에 띄는 기본값을 쓴다 */
const FALLBACK_MM: StickerMm = [6, 6];

/**
 * 옵션 목록은 lib/bootskin-stickers.json에서 온다 — 값·원본 파일·실측 mm가 한곳에 있다.
 *
 * mm는 상품 원본 이미지 하단에 인쇄된 "가로: N mm / 세로: N mm" 캡션을
 * `npm run sync-bootskin`이 읽은 값이다. 한 변만 인쇄된 그룹(포지션·모티베이션은 가로만,
 * 이모지는 세로만)은 원본 잉크 경계 상자 비율로 나머지 변을 유도한다.
 * 화면을 보며 임의로 조정하지 말 것 — 크기가 달라 보이면 슬롯의 mmScale을 만진다.
 *
 * 투명 스티커 파일명은 생성기가 원본의 순번을 뗀 이름이다 (`24-W-white.png` → `W-white.png`).
 */
function buildOptions(
  slug: string,
  plates: Record<string, StickerPlate> | undefined,
  tone: 'Black' | 'White',
): PreviewOption[] {
  const product = getStickerProduct(slug);
  return product.stickers.map((sticker) => {
    const { file, optionValue, inTone } = resolveSticker(product, sticker, tone);
    return {
      value: sticker.value,
      optionValue,
      light: inTone && tone === 'White',
      overlay: `${OVERLAY_ROOT}/${product.folder}/${file.replace(/^\d+-/, '')}`,
      mm: sticker.mm ?? FALLBACK_MM,
      plate: plates?.[sticker.value],
    };
  });
}

/** 미리보기 탭 구성. 크기는 매니페스트의 실측 mm에서 오고, 배치는 PREVIEW_SLOTS에서 온다. */
interface GroupSpec {
  key: string;
  label: string;
  slug: string;
  slot: PreviewSlot;
  maxPicks: number;
  fit: StickerFit;
  /** 흰 바탕이 디자인인 옵션만 (태극기) */
  plates?: Record<string, StickerPlate>;
}

/** 이니셜은 세 글자(예: KDB), 번호는 두 자리(예: 10)까지 나란히 붙이는 게 보통이다 */
const GROUP_SPECS: GroupSpec[] = [
  { key: 'number', label: '번호', slug: PRODUCT_SLUGS.BOOTSKIN_NUMBER, slot: 'front', maxPicks: 2, fit: 'height' },
  { key: 'initial', label: '이니셜', slug: PRODUCT_SLUGS.BOOTSKIN_ALPHABET, slot: 'front', maxPicks: 3, fit: 'height' },
  { key: 'nation', label: '국기', slug: PRODUCT_SLUGS.BOOTSKIN_KOREA, slot: 'front', maxPicks: 1, fit: 'box', plates: NATION_PLATES },
  { key: 'family', label: '가족', slug: PRODUCT_SLUGS.BOOTSKIN_FAMILY, slot: 'front', maxPicks: 1, fit: 'box' },
  { key: 'faith', label: '종교', slug: PRODUCT_SLUGS.BOOTSKIN_SYMBOL, slot: 'heel', maxPicks: 1, fit: 'box' },
  { key: 'symbol', label: '심볼', slug: PRODUCT_SLUGS.BOOTSKIN_SYMBOLS, slot: 'heel', maxPicks: 1, fit: 'box' },
  { key: 'position', label: '포지션', slug: PRODUCT_SLUGS.BOOTSKIN_POSITION, slot: 'front', maxPicks: 1, fit: 'box' },
  { key: 'motivation', label: '문구', slug: PRODUCT_SLUGS.BOOTSKIN_MOTIVATION, slot: 'heel', maxPicks: 1, fit: 'box' },
];

export function getPreviewGroups(tone: 'Black' | 'White'): PreviewGroup[] {
  return GROUP_SPECS.map((spec) => {
    const product = products[spec.slug as keyof typeof products];
    const stickerProduct = getStickerProduct(spec.slug);
    return {
      key: spec.key,
      label: spec.label,
      slug: spec.slug,
      productId: product.id,
      productName: product.name,
      thumbnail: product.image,
      slot: spec.slot,
      toned: Boolean(stickerProduct.tones) || stickerProduct.stickers.some((sticker) => sticker.colorFiles),
      maxPicks: spec.maxPicks,
      fit: spec.fit,
      options: buildOptions(spec.slug, spec.plates, tone),
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
