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
    ];
  },
};

module.exports = nextConfig;
