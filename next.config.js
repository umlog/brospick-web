/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Netlify Image CDN(@netlify/plugin-nextjs)이 next/image를 자동 최적화
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
