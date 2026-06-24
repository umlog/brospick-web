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
import PageTransition from './components/PageTransition';
import { SiteBanner } from './components/SiteBanner';
import { SitePopup } from './components/SitePopup';
import { SplashController } from './components/SplashController';
import { getActiveBanner, getActivePopup } from '@/lib/site-content';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://brospick.com'),
  title: '브로스픽 BROSPICK',
  description:
    '스포츠인들의 스토리를 기록하는 브로스픽입니다. 새롭게 출시된 의류와 다양한 컨텐츠를 만나보세요. 현재 하이라이트 커뮤니티 플랫폼 픽커 (picker)를 준비 중입니다.',
  openGraph: {
    title: '브로스픽 BROSPICK',
    description:
      'Sportswear × Teams × Community',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BROSPICK',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [banner, popup] = await Promise.all([getActiveBanner(), getActivePopup()]);

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
        <SplashController />
        <div
          id="__splash"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#121212',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <span
            style={{
              fontFamily: 'sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: '#ffffff',
            }}
          >
            BROSPICK
          </span>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function h(){var e=document.getElementById('__splash');if(!e)return;e.style.transition='opacity 0.5s ease';e.style.opacity='0';e.style.pointerEvents='none';setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},500);}if(document.readyState==='complete'){h();}else{window.addEventListener('load',h);}})();`,
          }}
        />

        <ThemeProvider>
          <CartProvider>
            <SiteBanner initialBanner={banner} />
            <Header />
            <PageTransition>{children}</PageTransition>
            <Footer />
            <SitePopup initialPopup={popup} />
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
