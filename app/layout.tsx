import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FloatingTracker from './components/FloatingTracker';
import VisitTracker from './components/VisitTracker';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'BROSPICK',
  description:
    '스포츠인들의 스토리를 기록하는 브로스픽입니다. 새롭게 출시된 의류와 다양한 컨텐츠를 만나보세요. 현재 하이라이트 커뮤니티 플랫폼 픽커 (picker)를 준비 중입니다.',
  openGraph: {
    title: 'Brospick',
    description:
      '선수의 실력을 기록하고, 그들에게 기회를 만듭니다.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable} data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <Suspense fallback={null}>
              <FloatingTracker />
            </Suspense>
            <VisitTracker />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
