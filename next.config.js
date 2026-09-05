/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Netlify Image CDN을 우회하는 커스텀 로더. scripts/gen-opt.mjs가 사전 생성한
    // /_opt/*-w{W}.webp 정적 파일을 직접 가리켜 Netlify 이미지 변환 토큰 소모를 0으로 만든다.
    loaderFile: './image-loader.js',
    // 로더의 WIDTHS와 일치(deviceSizes ∪ imageSizes = [256, 384, 640, 1080]).
    deviceSizes: [640, 1080],
    imageSizes: [256, 384],
    // 외부(Supabase Storage)는 로더가 원본 URL 그대로 통과시키므로 remotePatterns 유지.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // 구 숫자 ID URL → slug URL 영구 리다이렉트
      { source: '/apparel/1', destination: '/apparel/quarter-zip-training-top', permanent: true },
      // 부츠스킨을 /bootskin 컬렉션으로 분리 — 기존 /apparel 주소는 영구 이동.
      // 페이지 단에도 카테고리 기준 리다이렉트가 있지만, 그쪽은 정적 생성 시
      // meta refresh로 나가므로 검색엔진용 308은 여기서 처리한다.
      { source: '/apparel/bootskin-:slug', destination: '/bootskin/bootskin-:slug', permanent: true },
    ];
  },
};

module.exports = nextConfig;
