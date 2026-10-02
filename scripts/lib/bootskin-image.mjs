// 부츠스킨 원본 이미지(public/apparel/bootskin/<종류>/*.png) 공용 분석 함수.
//
// 원본은 900x900 캔버스 · 순백(또는 순흑) 배경 · 하단에 "가로: N mm / 세로: N mm" 캡션 구조다.
// gen-bootskin-overlay.mjs(투명 스티커 생성)와 sync-bootskin-stickers.mjs(매니페스트 갱신)가 함께 쓴다.
import sharp from 'sharp';

/** 캡션이 차지하는 하단 영역 비율 */
export const CAPTION_RATIO = 0.2;
/** 배경과 이만큼 차이나면 글리프로 본다 (0~765) */
export const GLYPH_THRESHOLD = 40;

/** 캡션 글자와 배경을 가르는 밝기 차이 (0~255). 안티앨리어싱 번짐은 글자로 치지 않는다 */
const CAPTION_INK_THRESHOLD = 100;
/** 캡션 끝의 "mm" 두 글자 판별 — 글자 폭이 줄 높이의 이 비율 이상이어야 m으로 본다 */
const MM_GLYPH_MIN_WIDTH_RATIO = 0.7;
/** "mm" 두 글자의 폭 차이 허용치(px) */
const MM_GLYPH_WIDTH_TOLERANCE = 4;
/** OCR 전에 확대하는 배율. 원본 캡션 글자 높이가 20px 남짓이라 그대로는 인식률이 낮다 */
const OCR_SCALE = 3;
const OCR_PADDING = 12;

/** 배경과 다른 픽셀의 경계 상자를 구한다 (캡션 영역 제외) */
export function glyphBounds(data, info, background) {
  const { width, height, channels } = info;
  const limitY = Math.floor(height * (1 - CAPTION_RATIO));
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < limitY; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const diff =
        Math.abs(data[i] - background[0]) +
        Math.abs(data[i + 1] - background[1]) +
        Math.abs(data[i + 2] - background[2]);
      if (diff <= GLYPH_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** 아트웍 잉크 경계 상자의 가로 ÷ 세로 */
export async function inkAspect(srcPath) {
  const { data, info } = await sharp(srcPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = glyphBounds(data, info, [data[0], data[1], data[2]]);
  if (!bounds) throw new Error(`글리프를 찾지 못함: ${srcPath}`);
  return bounds.width / bounds.height;
}

/** 1차원 투영에서 잉크가 이어지는 구간들을 [시작, 끝) 으로 돌려준다 */
function inkRuns(length, hasInk) {
  const runs = [];
  let start = -1;
  for (let i = 0; i < length; i++) {
    if (hasInk(i) && start < 0) start = i;
    if (!hasInk(i) && start >= 0) {
      runs.push([start, i]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, length]);
  return runs;
}

/**
 * 원본 하단 캡션에서 가로/세로 mm를 읽는다.
 *
 * tesseract는 캡션 끝의 "mm"를 숫자(00, 07 등)로 잘못 읽어 값 뒤에 붙인다.
 * 그래서 줄마다 글자 덩어리를 열 단위로 나눈 뒤 마지막 두 덩어리(m, m)를 잘라내고
 * "가로: 8.5" 부분만 인식시킨다.
 *
 * @param worker tesseract.js 'kor' 워커
 * @returns 캡션에 인쇄된 변만 담긴 객체 — 예: { width: 17 } / { width: 8, height: 6 }
 */
export async function readCaptionMm(worker, srcPath) {
  const meta = await sharp(srcPath).metadata();
  const top = Math.floor(meta.height * (1 - CAPTION_RATIO));
  const { data, info } = await sharp(srcPath)
    .removeAlpha()
    .extract({ left: 0, top, width: meta.width, height: meta.height - top })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = data[0];
  const ink = (x, y) => Math.abs(data[y * info.width + x] - background) > CAPTION_INK_THRESHOLD;

  const rows = inkRuns(info.height, (y) => {
    for (let x = 0; x < info.width; x++) if (ink(x, y)) return true;
    return false;
  });

  const result = {};
  for (const [y0, y1] of rows) {
    const rowHeight = y1 - y0;
    const glyphs = inkRuns(info.width, (x) => {
      for (let y = y0; y < y1; y++) if (ink(x, y)) return true;
      return false;
    });

    const [m1, m2] = glyphs.slice(-2).map(([s, e]) => e - s);
    const looksLikeMm =
      glyphs.length > 3 &&
      m1 >= rowHeight * MM_GLYPH_MIN_WIDTH_RATIO &&
      Math.abs(m1 - m2) <= MM_GLYPH_WIDTH_TOLERANCE;
    if (!looksLikeMm) {
      throw new Error(`캡션 줄 끝에서 "mm"를 찾지 못함 (y=${top + y0})`);
    }

    const left = glyphs[0][0];
    const right = glyphs[glyphs.length - 3][1];
    const crop = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } })
      .extract({ left, top: y0, width: right - left, height: rowHeight })
      .negate(background < 128 ? {} : false)
      .extend({ top: OCR_PADDING, bottom: OCR_PADDING, left: OCR_PADDING, right: OCR_PADDING, background: '#ffffff' })
      .resize({ width: (right - left + OCR_PADDING * 2) * OCR_SCALE })
      .png()
      .toBuffer();

    const { data: { text } } = await worker.recognize(crop);
    const match = text.replace(/\s/g, '').match(/^(가로|세로)[:;.]?(\d+(?:\.\d+)?)$/);
    if (!match) throw new Error(`캡션을 읽지 못함: "${text.trim()}"`);
    result[match[1] === '가로' ? 'width' : 'height'] = Number(match[2]);
  }

  if (result.width === undefined && result.height === undefined) {
    throw new Error('캡션이 없음');
  }
  return result;
}
