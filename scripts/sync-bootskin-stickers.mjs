// 부츠스킨 폴더에 새로 넣은 스티커 원본을 매니페스트(lib/bootskin-stickers.json)에 추가한다.
//
//   npm run sync-bootskin
//
// 매니페스트에 등록된 상품 폴더(public/apparel/bootskin/<folder>)를 훑어 아직 없는 PNG를 찾고,
//   - 옵션 값: 파일명에서 순번·확장자를 떼고 '-'를 공백으로 (`30-THANK-YOU.png` → `THANK YOU`)
//   - mm: 이미지 하단 캡션("가로: N mm / 세로: N mm")을 OCR로 읽는다.
//         한 변만 인쇄돼 있으면 나머지 변은 잉크 경계 상자 비율로 유도한다.
// 를 채워 목록 끝에 붙인다. 이미 등록된 스티커는 건드리지 않는다.
//
// 추가된 스티커는 상품 상세(옵션·갤러리)와 /bootskin 미리보기에 자동으로 나타난다.
// 재고 행(product_sizes)은 어드민 상품 관리의 "동기화"로 만든다.
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { createWorker } from 'tesseract.js';
import { inkAspect, readCaptionMm } from './lib/bootskin-image.mjs';
import { MANIFEST_PATH, readManifest, stickerFiles, stripOrder, writeManifest } from './lib/bootskin-manifest.mjs';

const SRC_ROOT = join('public', 'apparel', 'bootskin');
/** tesseract 한국어 학습 데이터 캐시 — 기본값은 작업 폴더라 저장소에 파일이 생긴다 */
const OCR_CACHE_PATH = join('node_modules', '.cache', 'tesseract');
/** 원본 캡션은 0.5mm 단위, 유도한 변은 0.1mm 단위로 기록한다 */
const MM_DECIMALS = 10;
/** 톤 상품이 아닌 상품에서 스티커별로 덧붙일 수 있는 색 (파일명 접미사 `-white`) */
const EXTRA_COLORS = ['White'];

const round = (value) => Math.round(value * MM_DECIMALS) / MM_DECIMALS;
const orderOf = (fileName) => Number(fileName.match(/^(\d+)-/)?.[1] ?? Number.MAX_SAFE_INTEGER);

/** 상세 설명(*-detail) · 목록 대표 사진(*-thumb)은 실착 사진이라 스티커가 아니다 (생성기와 같은 규칙) */
function isStickerSource(fileName) {
  return fileName.endsWith('.png') && !fileName.includes('detail') && !fileName.includes('thumb');
}

/** 톤 상품의 파일을 톤별로 묶는다. 첫 톤은 접미사가 없고 나머지는 `-<톤 소문자>` 접미사다 (`1-0.png` / `1-0-white.png`) */
function groupByTone(fileNames, tones) {
  const groups = new Map();
  for (const fileName of fileNames) {
    const base = stripOrder(fileName).replace(/\.png$/, '');
    const tone = tones.slice(1).find((candidate) => base.endsWith(`-${candidate.toLowerCase()}`)) ?? tones[0];
    const key = tone === tones[0] ? base : base.slice(0, -(tone.length + 1));
    if (!groups.has(key)) groups.set(key, {});
    groups.get(key)[tone] = fileName;
  }
  return groups;
}

async function measure(worker, srcPath) {
  const caption = await readCaptionMm(worker, srcPath);
  if (caption.width !== undefined && caption.height !== undefined) {
    return [caption.width, caption.height];
  }
  const aspect = await inkAspect(srcPath);
  return caption.width !== undefined
    ? [caption.width, round(caption.width / aspect)]
    : [round(caption.height * aspect), caption.height];
}

const manifest = readManifest();
const added = [];
const warnings = [];
let worker = null;

for (const [slug, product] of Object.entries(manifest)) {
  const folder = join(SRC_ROOT, product.folder);
  if (!existsSync(folder)) {
    warnings.push(`${slug}: 폴더가 없음 (${folder})`);
    continue;
  }

  const onDisk = readdirSync(folder).filter(isStickerSource);
  const known = new Set(product.stickers.flatMap(stickerFiles));
  for (const file of known) {
    if (!onDisk.includes(file)) warnings.push(`${slug}: 매니페스트의 ${file} 원본이 폴더에 없음`);
  }

  const unknownFiles = onDisk
    .filter((file) => !known.has(file))
    .sort((a, b) => orderOf(a) - orderOf(b) || a.localeCompare(b));

  // 톤 상품이 아닌데 기존 스티커와 이름이 같고 `-white`만 붙은 파일은 새 스티커가 아니라
  // 그 스티커의 추가 색이다 (`1-CROSS.png` + `1-CROSS-white.png` → 옵션 `CROSS — White`)
  const newFiles = [];
  for (const file of unknownFiles) {
    const base = stripOrder(file).replace(/\.png$/, '');
    const color = EXTRA_COLORS.find((candidate) => base.endsWith(`-${candidate.toLowerCase()}`));
    const owner = color && !product.tones
      ? product.stickers.find((sticker) => sticker.file && stripOrder(sticker.file) === `${base.slice(0, -(color.length + 1))}.png`)
      : undefined;
    if (!owner) {
      newFiles.push(file);
      continue;
    }
    owner.colorFiles = { ...owner.colorFiles, [color]: file };
    added.push(`${slug}: "${owner.value} — ${color}" 색상 추가 (${file})`);
  }
  if (newFiles.length === 0) continue;

  const candidates = product.tones
    ? [...groupByTone(newFiles, product.tones)].map(([key, files]) => ({ key, files }))
    : newFiles.map((file) => ({ key: stripOrder(file).replace(/\.png$/, ''), file }));

  for (const candidate of candidates) {
    const value = candidate.key.replace(/-/g, ' ');
    if (product.stickers.some((sticker) => sticker.value === value)) {
      warnings.push(`${slug}: 옵션 값 "${value}"가 이미 있어 건너뜀 — 파일명을 바꾸거나 매니페스트에 직접 추가하세요`);
      continue;
    }
    if (product.tones) {
      const missingTones = product.tones.filter((tone) => !candidate.files[tone]);
      if (missingTones.length > 0) {
        warnings.push(`${slug}: "${value}"의 ${missingTones.join('·')} 원본이 없어 건너뜀`);
        continue;
      }
    }

    const primaryFile = candidate.file ?? candidate.files[product.tones[0]];
    worker ??= await createWorker('kor', undefined, { cachePath: OCR_CACHE_PATH });
    // 캡션 한 줄씩 넘기므로 단일 행 모드로 읽는다
    await worker.setParameters({ tessedit_pageseg_mode: '7', user_defined_dpi: '300' });

    let mm = null;
    try {
      mm = await measure(worker, join(folder, primaryFile));
    } catch (error) {
      warnings.push(`${slug}: ${primaryFile} mm 판독 실패 (${error.message}) — 매니페스트에 "mm": [가로, 세로]를 직접 넣으세요`);
    }

    const sticker = candidate.file
      ? { value, file: candidate.file, mm }
      : { value, files: Object.fromEntries(product.tones.map((tone) => [tone, candidate.files[tone]])), mm };
    product.stickers.push(sticker);
    added.push(`${slug}: "${value}" ${mm ? `${mm[0]}×${mm[1]}mm` : 'mm 없음'} (${stickerFiles(sticker).join(', ')})`);
  }
}

await worker?.terminate();

if (added.length > 0) {
  writeManifest(manifest);
  console.log(`[sync-bootskin] ${added.length}개 추가 → ${MANIFEST_PATH}`);
  for (const line of added) console.log(`  + ${line}`);
  console.log(`
다음 단계:
  1. 옵션 값이 판매 이름과 맞는지 확인 (파일명에서 자동 생성). 고칠 땐 ${MANIFEST_PATH}의 value만 바꾼다
  2. 흰색이 디자인인 풀컬러 아트웍(국기·이모지 등)이면 "fullColor": true 추가
  3. 어드민 상품 관리에서 "동기화" → 새 옵션의 재고 행 생성 후 재고 입력
  4. npm run gen-bootskin 으로 미리보기 투명본 확인`);
} else {
  console.log('[sync-bootskin] 새 스티커 없음');
}

if (warnings.length > 0) {
  console.warn(`\n[sync-bootskin] 확인 필요 ${warnings.length}건`);
  for (const line of warnings) console.warn(`  ! ${line}`);
  process.exitCode = 1;
}
