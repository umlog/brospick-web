// public/ 이미지 일괄 최적화. 경로·확장자는 유지하고 해상도 캡 + 재압축.
// 결과가 원본보다 작을 때만 덮어쓴다(안전). DRY=1 이면 미리보기만.
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync, renameSync } from 'fs';
import { join, extname } from 'path';

const ROOT = 'public';
const DRY = process.env.DRY === '1';
const MAX_SIDE = 2000;     // 일반 이미지 최장변 캡
const JPEG_Q = 82;
const PNG_Q = 90;          // palette quantize 품질

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const exts = new Set(['.png', '.jpg', '.jpeg']);
const files = walk(ROOT).filter((f) => exts.has(extname(f).toLowerCase()));

let beforeTotal = 0, afterTotal = 0, changed = 0, skipped = 0;

for (const f of files) {
  const ext = extname(f).toLowerCase();
  const before = statSync(f).size;
  beforeTotal += before;
  try {
    const img = sharp(f, { failOn: 'none' });
    const meta = await img.metadata();
    const longest = Math.max(meta.width || 0, meta.height || 0);

    let pipe = sharp(f, { failOn: 'none' }).rotate(); // EXIF 회전 반영
    if (longest > MAX_SIDE) {
      pipe = pipe.resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
    }
    if (ext === '.png') {
      pipe = pipe.png({ palette: true, quality: PNG_Q, effort: 8, compressionLevel: 9 });
    } else {
      pipe = pipe.jpeg({ quality: JPEG_Q, mozjpeg: true });
    }

    const buf = await pipe.toBuffer();
    const after = buf.length;

    if (after < before * 0.95) { // 최소 5% 이상 줄어야 교체
      afterTotal += after;
      changed++;
      const mb = (n) => (n / 1024 / 1024).toFixed(2);
      console.log(`${mb(before)}MB -> ${mb(after)}MB  ${f}`);
      if (!DRY) {
        const tmp = f + '.tmp';
        writeFileSync(tmp, buf);
        renameSync(tmp, f);
      }
    } else {
      afterTotal += before;
      skipped++;
    }
  } catch (e) {
    afterTotal += before;
    skipped++;
    console.log(`SKIP(err) ${f} :: ${e.message}`);
  }
}

const GB = (n) => (n / 1024 / 1024 / 1024).toFixed(3);
console.log(`\n${DRY ? '[DRY] ' : ''}변경 ${changed}개 / 스킵 ${skipped}개`);
console.log(`전체: ${GB(beforeTotal)}GB -> ${GB(afterTotal)}GB  (절감 ${GB(beforeTotal - afterTotal)}GB, ${((1 - afterTotal / beforeTotal) * 100).toFixed(1)}%)`);
