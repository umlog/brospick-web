// 부츠스킨 미리보기(BootskinPreview)가 축구화 사진 위에 얹을 투명 스티커를 만든다.
//
// 원본(public/apparel/bootskin/<종류>/*.png)은 상품 목록용 이미지라
// 900x900 캔버스 · 순백(또는 순흑) 배경 · 하단에 "가로/세로 mm" 캡션이 들어있다.
// 여기서 캡션을 잘라내고 배경을 투명으로 바꾼 뒤 글리프 크기로 트리밍해
// public/_bootskin/<종류>/<파일명>.png 로 내보낸다.
//
// 산출물은 .gitignore 대상이며 prebuild에서 매번 생성된다.
// 파일이 작아 next/image를 태우지 않으므로 gen-opt.mjs는 이 폴더를 건너뛴다.
import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_ROOT = join('public', 'apparel', 'bootskin');
const OUT_ROOT = join('public', '_bootskin');
/** 스티커 종류 폴더 — 상세 설명 이미지만 있는 폴더(BootSkinBanner 등)는 제외 */
const KINDS = ['number', 'initial', 'nation', 'symbol', 'faith-symbol', 'family', 'position', 'motivation'];
/**
 * 흰색이 디자인의 일부인 풀컬러 아트웍 (`<종류>/<파일명>`).
 *
 * 아래 toRgba는 흰 배경을 걷어내려고 흰 픽셀을 투명으로 만든다. 검은 글리프에는
 * 맞지만 브라질 국기의 흰 띠나 해골·유령처럼 흰색 자체가 그림인 경우 그 부분에
 * 구멍이 뚫린다. 태극기는 흰 판을 뒤에 깔아 가렸지만(bootskin.config.ts의
 * NATION_PLATES) 해골처럼 윤곽이 복잡한 그림은 판으로 못 덮는다.
 *
 * 그래서 이 목록의 파일은 알파 되돌리기를 건너뛰고, 테두리에서 번져 닿은 바깥
 * 배경만 투명으로 만든다. 안쪽 픽셀은 원본 색 그대로 남는다.
 */
const FULL_COLOR = new Set([
  'nation/4-BRAZIL.png',
  'symbol/17-cloud-face.png',
  'symbol/18-hot-face.png',
  'symbol/19-devil.png',
  'symbol/20-salute.png',
  'symbol/21-star-eyes.png',
  'symbol/22-shush.png',
  'symbol/23-angry.png',
  'symbol/24-cold-face.png',
  'symbol/25-yawn.png',
  'symbol/26-hand-over-mouth.png',
  'symbol/27-skull.png',
  'symbol/28-alien.png',
  'symbol/29-ghost.png',
]);
/** 캡션이 차지하는 하단 영역 비율 */
const CAPTION_RATIO = 0.2;
/** 배경과 이만큼 차이나면 글리프로 본다 (0~765) */
const GLYPH_THRESHOLD = 40;
/** 트리밍 후 최대 변 길이 */
const MAX_EDGE = 300;
/** 변환 규칙이 바뀌면 기존 생성물도 다시 만들어야 하므로 이 파일의 수정 시각도 기준에 넣는다 */
const SCRIPT_MTIME = statSync(new URL(import.meta.url)).mtimeMs;

/**
 * 순백/순흑 배경 위에 합성된 글리프를 알파 채널로 되돌린다.
 * 흰 배경: composite = a*C + (1-a)*255  →  a = 1 - min(RGB)/255
 * 검은 배경: composite = a*C            →  a = max(RGB)/255
 */
function toRgba(data, info, darkBackground) {
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const alpha = darkBackground
      ? Math.max(r, g, b) / 255
      : 1 - Math.min(r, g, b) / 255;

    const o = p * 4;
    if (alpha <= 0.01) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      continue;
    }
    const unmix = (v) => {
      const base = darkBackground ? v / alpha : (v - (1 - alpha) * 255) / alpha;
      return Math.max(0, Math.min(255, Math.round(base)));
    };
    out[o] = unmix(r);
    out[o + 1] = unmix(g);
    out[o + 2] = unmix(b);
    out[o + 3] = Math.round(alpha * 255);
  }
  return out;
}

/**
 * 테두리에서 배경색을 따라 번져 나가 그림 바깥에 해당하는 배경 픽셀을 찾는다.
 *
 * 그림에 막혀 닿지 못한 배경색 픽셀은 "안쪽"이므로 이 마스크에서 빠진다.
 *
 * @returns 바깥 배경이면 true인 마스크
 */
function outsideBackground(data, info, background) {
  const { width, height, channels } = info;
  const isBg = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const diff =
      Math.abs(data[i] - background[0]) +
      Math.abs(data[i + 1] - background[1]) +
      Math.abs(data[i + 2] - background[2]);
    isBg[p] = diff <= GLYPH_THRESHOLD ? 1 : 0;
  }

  const outside = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;

  const push = (p) => {
    if (isBg[p] && !outside[p]) {
      outside[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  return { isBg, outside };
}

/**
 * 외곽선 안쪽의 배경색 영역을 찾는다.
 *
 * 흰 배경에 그려진 화이트 스티커(⚡·👑·🤍 white / 태극기 원형)는 채움이 배경과
 * 같은 흰색이라 알파 되돌리기만으로는 통째로 투명해진다. 바깥 배경을 걷어내고
 * 남은 배경색 픽셀이 곧 "채워야 할 안쪽"이다.
 *
 * 검은 글리프의 속구멍(0·8·A의 구멍)은 실제 제품도 뚫려 있어야 하므로
 * 이 처리를 태우지 않는다 — 호출부의 needsWhiteFill 조건 참고.
 *
 * @returns 안쪽이면 true인 마스크. 안쪽이 없으면 null.
 */
function enclosedBackground(data, info, background) {
  const { isBg, outside } = outsideBackground(data, info, background);
  let inside = 0;
  const mask = new Uint8Array(isBg.length);
  for (let p = 0; p < isBg.length; p++) {
    if (isBg[p] && !outside[p]) {
      mask[p] = 1;
      inside++;
    }
  }
  return inside > 0 ? mask : null;
}

/**
 * 풀컬러 아트웍용 — 바깥 배경만 투명으로 만들고 나머지는 원본 색 그대로 둔다.
 *
 * toRgba와 달리 흰 픽셀을 지우지 않으므로 국기의 흰 띠, 해골, 유령이 살아남는다.
 * 대신 반투명 경계가 없어 가장자리가 1px 각지지만, 미리보기 크기(최대 300px)에서는
 * 드러나지 않는다.
 */
function opaqueOnBackground(data, info, background) {
  const { channels } = info;
  const { outside } = outsideBackground(data, info, background);
  const out = Buffer.alloc(outside.length * 4);

  for (let p = 0; p < outside.length; p++) {
    const o = p * 4;
    if (outside[p]) continue; // Buffer.alloc이 0으로 채워 두므로 투명 그대로
    const i = p * channels;
    out[o] = data[i];
    out[o + 1] = data[i + 1];
    out[o + 2] = data[i + 2];
    out[o + 3] = 255;
  }
  return out;
}

/** 배경과 다른 픽셀의 경계 상자를 구한다 (캡션 영역 제외) */
function glyphBounds(data, info, background) {
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

let made = 0, skipped = 0, errors = 0;

for (const kind of KINDS) {
  const srcDir = join(SRC_ROOT, kind);
  if (!existsSync(srcDir)) continue;

  const outDir = join(OUT_ROOT, kind);
  mkdirSync(outDir, { recursive: true });

  for (const name of readdirSync(srcDir)) {
    // *-detail.png 은 상세 설명용 이미지라 스티커가 아니다
    if (!name.endsWith('.png') || name.includes('detail')) continue;

    const srcPath = join(srcDir, name);
    // 원본은 `순번-값.png` 이지만 순번이 일부 어긋나 있다(예: 23-W.png / 24-W-white.png).
    // 순번을 떼고 값만 남겨 옵션 값으로 바로 찾을 수 있게 한다.
    const outPath = join(outDir, name.replace(/^\d+-/, ''));

    if (
      existsSync(outPath) &&
      statSync(outPath).mtimeMs >= Math.max(statSync(srcPath).mtimeMs, SCRIPT_MTIME)
    ) {
      skipped++;
      continue;
    }

    try {
      const { data, info } = await sharp(srcPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const background = [data[0], data[1], data[2]];
      const darkBackground = background[0] + background[1] + background[2] < 384;

      const bounds = glyphBounds(data, info, background);
      if (!bounds) {
        console.warn(`[gen-bootskin] 글리프를 찾지 못함: ${srcPath}`);
        errors++;
        continue;
      }

      const fullColor = FULL_COLOR.has(`${kind}/${name}`);
      const rgba = fullColor
        ? opaqueOnBackground(data, info, background)
        : toRgba(data, info, darkBackground);

      // 흰 배경에 그려진 화이트 스티커·원형 국기는 채움이 배경색과 같아 위에서 지워졌다.
      // 외곽선 안쪽만 흰색으로 되살린다. (검은 배경 원본은 채움이 이미 살아 있다)
      const needsWhiteFill =
        !fullColor && !darkBackground && (name.includes('-white') || name.includes('-circle'));
      if (needsWhiteFill) {
        const enclosed = enclosedBackground(data, info, background);
        if (enclosed) {
          for (let p = 0; p < enclosed.length; p++) {
            if (!enclosed[p]) continue;
            const o = p * 4;
            rgba[o] = rgba[o + 1] = rgba[o + 2] = rgba[o + 3] = 255;
          }
        } else {
          console.warn(`[gen-bootskin] 외곽선 안쪽을 찾지 못함: ${srcPath}`);
        }
      }

      await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extract(bounds)
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
      made++;
    } catch (error) {
      console.error(`[gen-bootskin] 실패: ${srcPath} — ${error.message}`);
      errors++;
    }
  }
}

console.log(`[gen-bootskin] 생성 ${made} / 스킵 ${skipped} / 에러 ${errors}`);
if (errors > 0) process.exitCode = 1;
