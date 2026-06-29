// next/image 커스텀 로더(image-loader.js)가 가리키는 /_opt/*-w{W}.webp 정적 파일을 생성한다.
// 빌드 전(prebuild)에 실행되어 Netlify Image CDN 변환을 0으로 만든다.
//
// public/ 아래 로컬 라스터(png/jpg/jpeg/webp) 각각에 대해 WIDTHS 버킷별 webp를 만든다.
// WIDTHS는 image-loader.js·next.config.js(deviceSizes ∪ imageSizes)와 반드시 일치해야 한다.
// 원본보다 큰 버킷은 원본 크기로 캡(withoutEnlargement)해 항상 파일이 존재하도록 보장 → 404 방지.
import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, extname, dirname, relative } from 'path';

const SRC_ROOT = 'public';
const OUT_ROOT = join('public', '_opt');
const WIDTHS = [256, 384, 640, 1080];
const WEBP_Q = 80;
const RASTER = /\.(png|jpe?g|webp)$/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (p.startsWith(OUT_ROOT)) continue; // 생성물 자기 자신 제외
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (RASTER.test(p)) out.push(p);
  }
  return out;
}

const files = walk(SRC_ROOT);
let made = 0, skipped = 0, errors = 0;

for (const src of files) {
  const srcMtime = statSync(src).mtimeMs;
  const rel = relative(SRC_ROOT, src).replace(RASTER, ''); // 확장자 제거
  let meta;
  try {
    meta = await sharp(src, { failOn: 'none' }).metadata();
  } catch (e) {
    errors++;
    console.log(`SKIP(meta) ${src} :: ${e.message}`);
    continue;
  }
  const origWidth = meta.width || WIDTHS[WIDTHS.length - 1];

  for (const w of WIDTHS) {
    const outPath = join(OUT_ROOT, `${rel}-w${w}.webp`);
    // 증분: 결과물이 원본보다 최신이면 스킵
    if (existsSync(outPath) && statSync(outPath).mtimeMs >= srcMtime) {
      skipped++;
      continue;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    try {
      await sharp(src, { failOn: 'none' })
        .rotate()
        .resize({ width: Math.min(w, origWidth), withoutEnlargement: true })
        .webp({ quality: WEBP_Q, effort: 4 })
        .toFile(outPath);
      made++;
    } catch (e) {
      errors++;
      console.log(`SKIP(err) ${outPath} :: ${e.message}`);
    }
  }
}

console.log(`\n[gen-opt] 생성 ${made} / 스킵 ${skipped} / 에러 ${errors}  (원본 ${files.length}개 × 버킷 ${WIDTHS.length})`);
