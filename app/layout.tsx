import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BROSPICK',
  description:
    '대학 축구 선수들의 실력과 스토리를 기록하는 브로스픽. 인터뷰·하이라이트 콘텐츠와 함께, 하이라이트 플랫폼 픽커(Picker)를 준비 중입니다.',
  openGraph: {
    title: 'Brospick',
    description:
      '무명 선수의 실력을 기록하고, 그들에게 기회를 만듭니다.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body>{children}</body>
    </html>
  );
}
