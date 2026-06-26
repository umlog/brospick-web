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
import { SiteBannerServer } from './components/SiteBannerServer';
import { SitePopupServer } from './components/SitePopupServer';
import { SplashController } from './components/SplashController';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import CartToast from './components/CartToast';

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
        <SplashController />
        <div
          id="__splash"
          suppressHydrationWarning
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
            className="splash-logo"
            style={{
              fontFamily: 'sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '0.3em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            BROSPICK
          </span>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .splash-logo {
                animation: splashRush 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
              }
              @keyframes splashRush {
                0% {
                  opacity: 0;
                  transform: scale(2.6);
                  letter-spacing: 0.9em;
                  filter: blur(10px);
                }
                65% {
                  opacity: 1;
                  transform: scale(0.94);
                  letter-spacing: 0.28em;
                  filter: blur(0);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                  letter-spacing: 0.3em;
                  filter: blur(0);
                }
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function h(){var e=document.getElementById('__splash');if(!e)return;e.style.transition='opacity 0.3s ease, transform 0.3s ease';e.style.opacity='0';e.style.transform='scale(1.08)';e.style.pointerEvents='none';setTimeout(function(){e.style.display='none';},300);}function go(){setTimeout(h,520);}if(document.readyState!=='loading'){go();}else{document.addEventListener('DOMContentLoaded',go);}})();`,
          }}
        />

        <ThemeProvider>
          <CartProvider>
            <Suspense fallback={null}>
              <SiteBannerServer />
            </Suspense>
            <Header />
            <ScrollProgress />
            <PageTransition>{children}</PageTransition>
            <Footer />
            <Suspense fallback={null}>
              <SitePopupServer />
            </Suspense>
            <CartToast />
            <BackToTop />
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
