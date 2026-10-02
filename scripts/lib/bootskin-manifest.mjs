// lib/bootskin-stickers.json 읽기·쓰기. 구조 설명은 lib/bootskin-stickers.ts 참고.
import { readFileSync, writeFileSync } from 'fs';

export const MANIFEST_PATH = 'lib/bootskin-stickers.json';

export function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

/** 원본 파일명의 순번을 뗀 이름 — 투명 스티커(public/_bootskin) 파일명과 같다 */
export function stripOrder(fileName) {
  return fileName.replace(/^\d+-/, '');
}

/** 한 스티커가 가리키는 원본 파일들 (톤 상품은 톤별 파일, 스티커별 추가 색 포함) */
export function stickerFiles(sticker) {
  const base = sticker.files ? Object.values(sticker.files) : [sticker.file];
  return [...base, ...Object.values(sticker.colorFiles ?? {})];
}

/** diff가 읽기 쉽도록 스티커 한 개를 한 줄에 쓴다 */
export function writeManifest(manifest) {
  const products = Object.entries(manifest).map(([slug, product]) => {
    const { stickers, ...meta } = product;
    const metaLines = Object.entries(meta).map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    const stickerLines = stickers.map((sticker) => `      ${JSON.stringify(sticker)}`).join(',\n');
    return `  ${JSON.stringify(slug)}: {\n${metaLines.join('\n')}\n    "stickers": [\n${stickerLines}\n    ]\n  }`;
  });
  writeFileSync(MANIFEST_PATH, `{\n${products.join(',\n')}\n}\n`);
}
