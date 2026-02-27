/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // 구 숫자 ID URL → slug URL 영구 리다이렉트
      { source: '/apparel/1', destination: '/apparel/half-zip-training-top', permanent: true },
    ];
  },
};

module.exports = nextConfig;
