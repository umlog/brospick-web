/**
 * 부츠스킨 스티커 매니페스트(lib/bootskin-stickers.json) 접근 함수.
 *
 * 스티커 옵션의 단일 원본이다. 상품 상세(lib/products.ts의 sizes·sizeImages·images)와
 * 축구화 미리보기(app/bootskin/bootskin.config.ts), 투명 스티커 생성기가 모두 여기서 읽는다.
 *
 * 새 스티커는 손으로 적지 않는다 — 원본 PNG를 폴더에 넣고 `npm run sync-bootskin`을 돌리면
 * 파일명에서 옵션 값을, 이미지 하단 캡션에서 mm를 읽어 이 파일 끝에 추가한다.
 * 자동으로 만든 값(예: `30-THANK-YOU.png` → `THANK YOU`)이 어색하면 JSON에서 value만 고친다.
 *
 * 주의: value는 주문·재고(product_sizes.size)의 키다. 이미 판매 중인 옵션의 value를 바꾸면
 * DB 행도 같이 rename해야 한다.
 */
import manifest from './bootskin-stickers.json';

const ASSET_ROOT = '/apparel/bootskin';

export interface BootskinSticker {
  /** 옵션 값. 톤 상품이면 톤을 뺀 값이다 (`7` → 옵션 문자열은 `7 — Black`) */
  value: string;
  /** 원본 파일명 (톤이 없는 상품) */
  file?: string;
  /** 톤별 원본 파일명 (톤 상품) */
  files?: Record<string, string>;
  /**
   * 톤 상품이 아닌데 이 스티커만 다른 색이 더 있을 때 — 색상 이름 → 원본 파일명.
   * 기본색(file)의 옵션 값은 그대로 두고, 추가 색만 `값 — 색상`(`CROSS — White`)이 된다.
   * 기본색 키를 안 바꾸는 이유: 이미 팔리던 옵션이라 재고·주문 행이 그 값으로 쌓여 있다.
   */
  colorFiles?: Record<string, string>;
  /** 옵션을 고를 때 보여줄 이미지가 스티커 원본과 다를 때만 (실착 사진 등) */
  listImage?: string;
  /** 흰색이 디자인의 일부인 풀컬러 아트웍 — 생성기가 흰 픽셀을 지우지 않는다 */
  fullColor?: boolean;
  /** 캡션에서 읽은 실측 크기 [가로mm, 세로mm]. 읽지 못했으면 null */
  mm: [number, number] | null;
}

export interface BootskinStickerProduct {
  /** public/apparel/bootskin 하위 폴더명 */
  folder: string;
  /** 블랙/화이트처럼 같은 아트웍이 톤별로 있는 상품 */
  tones?: string[];
  stickers: BootskinSticker[];
}

// JSON import는 mm를 number[]로 추론한다. 두 칸 배열은 sync-bootskin-stickers.mjs가 보장한다
const stickerProducts = manifest as unknown as Record<string, BootskinStickerProduct>;

export function getStickerProduct(slug: string): BootskinStickerProduct {
  const product = stickerProducts[slug];
  if (!product) throw new Error(`[bootskin-stickers] 매니페스트에 없는 상품: ${slug}`);
  return product;
}

/** 톤이 있으면 톤별 파일, 없으면 단일 파일 */
export function getStickerFile(sticker: BootskinSticker, tone?: string): string {
  const file = tone && sticker.files ? sticker.files[tone] : sticker.file;
  if (!file) throw new Error(`[bootskin-stickers] 파일이 없는 스티커: ${sticker.value} (${tone ?? '톤 없음'})`);
  return file;
}

/** 스티커 하나를 고른 색으로 풀었을 때의 원본 파일과 옵션 값(재고·주문 키) */
export interface ResolvedSticker {
  file: string;
  optionValue: string;
  /** 고른 색의 아트웍이 실제로 있는지. 없으면 기본색으로 대신한 것이다 */
  inTone: boolean;
}

/** 그 색이 없는 스티커는 기본색으로 돌려준다 — 색을 바꿨다고 옵션이 사라지지 않게 */
export function resolveSticker(
  product: BootskinStickerProduct,
  sticker: BootskinSticker,
  tone: string,
): ResolvedSticker {
  if (product.tones) {
    return { file: getStickerFile(sticker, tone), optionValue: `${sticker.value} — ${tone}`, inTone: true };
  }
  const colorFile = sticker.colorFiles?.[tone];
  if (colorFile) {
    return { file: colorFile, optionValue: `${sticker.value} — ${tone}`, inTone: true };
  }
  return { file: getStickerFile(sticker), optionValue: sticker.value, inTone: false };
}

/** products.ts `sizes` */
export function stickerSizes(slug: string): string[] {
  return getStickerProduct(slug).stickers.map((sticker) => sticker.value);
}

/** products.ts `sizeImages` — 톤 상품과 스티커별 추가 색은 `값 — 색` 키로 펼친다 */
export function stickerSizeImages(slug: string): Record<string, string> {
  const { folder, tones, stickers } = getStickerProduct(slug);
  const entries = stickers.flatMap((sticker) =>
    tones
      ? tones.map((tone) => [`${sticker.value} — ${tone}`, `${ASSET_ROOT}/${folder}/${getStickerFile(sticker, tone)}`])
      : [
          [sticker.value, `${ASSET_ROOT}/${folder}/${sticker.listImage ?? getStickerFile(sticker)}`],
          ...Object.entries(sticker.colorFiles ?? {}).map(([color, file]) => [
            `${sticker.value} — ${color}`,
            `${ASSET_ROOT}/${folder}/${file}`,
          ]),
        ],
  );
  return Object.fromEntries(entries);
}

/**
 * products.ts `colorSizes` — 스티커별 추가 색: 색상 이름 → 그 색으로 파는 옵션 값.
 * 추가 색이 하나도 없으면 undefined (상품에 색상 선택을 달 필요가 없다).
 */
export function stickerColorSizes(slug: string): Record<string, string[]> | undefined {
  const colorSizes: Record<string, string[]> = {};
  for (const sticker of getStickerProduct(slug).stickers) {
    for (const color of Object.keys(sticker.colorFiles ?? {})) {
      (colorSizes[color] ??= []).push(sticker.value);
    }
  }
  return Object.keys(colorSizes).length > 0 ? colorSizes : undefined;
}

/**
 * products.ts `images` — 손으로 고른 갤러리 순서는 그대로 두고, 아직 없는 스티커 이미지만 뒤에 붙인다.
 * 톤 상품은 톤별로 모아서 붙인다 (블랙 전부 → 화이트 전부). 스티커별 추가 색은 맨 뒤에 붙는다.
 */
export function withStickerImages(slug: string, curatedImages: string[]): string[] {
  const { folder, tones, stickers } = getStickerProduct(slug);
  const stickerImages = (tones ?? [undefined]).flatMap((tone) =>
    stickers.map((sticker) => `${ASSET_ROOT}/${folder}/${getStickerFile(sticker, tone)}`),
  );
  const colorImages = stickers.flatMap((sticker) =>
    Object.values(sticker.colorFiles ?? {}).map((file) => `${ASSET_ROOT}/${folder}/${file}`),
  );
  const missing = [...stickerImages, ...colorImages].filter((image) => !curatedImages.includes(image));
  return [...curatedImages, ...missing];
}
