// next/image 커스텀 로더. Netlify Image CDN을 우회하고
// scripts/gen-opt.mjs가 빌드 때 생성한 /_opt/*-w{W}.webp 정적 파일을 가리킨다.
// → Netlify 이미지 변환 토큰 소모 0.
//
// 외부 URL(Supabase 포함)·svg·gif 등 변환 대상이 아닌 것은 원본 그대로 통과.
// WIDTHS는 next.config.js의 deviceSizes ∪ imageSizes와 반드시 일치해야 한다.

const WIDTHS = [256, 384, 640, 1080];
const RASTER = /\.(png|jpe?g|webp)$/i;

export default function imageLoader({ src, width }) {
  // 외부 호스트(Supabase Storage 등)는 변환 없이 통과
  if (/^https?:\/\//.test(src)) return src;
  // 로컬 라스터만 사전 생성 webp로 매핑, 그 외(svg/gif 등)는 통과
  if (!RASTER.test(src)) return src;

  const targetWidth = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1];
  const noExt = src.replace(RASTER, '');
  return `/_opt${noExt}-w${targetWidth}.webp`;
}
