import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Noto_Sans_KR, Barlow_Condensed } from 'next/font/google';
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
import { SplashTransition } from './components/SplashTransition';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import CartToast from './components/CartToast';
import Analytics from './components/Analytics';
import {
  SYMBOL_MONOGRAM,
  SYMBOL_ORBIT,
  SYMBOL_SHIFT,
  SYMBOL_VIEWBOX,
} from './components/brand/symbol-paths';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

// 라틴 대문자 라벨·숫자 전용 디스플레이 서체 (저지 넘버·중계 자막 계열)
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
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
        width: 2000,
        height: 1125,
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
  // suppressHydrationWarning: 아래 인라인 스크립트가 하이드레이션 전에 data-theme을 덮어쓴다
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${barlowCondensed.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.documentElement;
                var theme = 'dark';
                try { theme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
                root.setAttribute('data-theme', theme);

                // 스플래시는 globals.css 로드 전에 그려질 수 있다 —
                // CSS 변수에 의존하지 않도록 색을 여기서 직접 심는다.
                var light = theme === 'light';
                root.style.setProperty('--splash-bg', light ? '#ffffff' : '#121212');
                root.style.setProperty('--splash-fg', light ? '#121212' : '#ffffff');
                root.style.setProperty('--splash-shine', light ? '#c22833' : '#d6303b');

                // 탭 세션당 1회만 재생. 재방문 시 첫 페인트를 가리지 않는다.
                try {
                  if (sessionStorage.getItem('splash_seen')) {
                    var s = document.createElement('style');
                    s.textContent = '#__splash{display:none!important}';
                    document.head.appendChild(s);
                  } else {
                    sessionStorage.setItem('splash_seen', '1');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <SplashController />
        <SplashTransition />
        <div id="__splash" suppressHydrationWarning>
          {/* 배경을 위·아래 두 패널로 나눠 커튼처럼 갈라지며 사라진다 */}
          <div className="splash-panel splash-panel-top" />
          <div className="splash-panel splash-panel-bottom" />
          <div className="splash-logo-wrap">
            {/* 원본 .ai 에서 뽑은 벡터 심볼을 그대로 심는다.
                하이드레이션 전에 그려져야 하므로 인라인 SVG만 쓸 수 있다. */}
            <svg className="splash-symbol" viewBox={SYMBOL_VIEWBOX} aria-hidden="true">
              <g transform={SYMBOL_SHIFT}>
                <g className="splash-mono">
                  <path d={SYMBOL_MONOGRAM} />
                </g>
                <g className="splash-orbit">
                  {SYMBOL_ORBIT.map((d) => (
                    <path key={d.length + d.slice(0, 12)} d={d} />
                  ))}
                </g>
              </g>
            </svg>
            <span className="splash-logo">BROSPICK</span>
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #__splash {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
              }
              /* 50.5% — 서브픽셀 반올림으로 가운데 실선이 비치는 것을 막는다 */
              .splash-panel {
                position: absolute;
                left: 0;
                right: 0;
                height: 50.5%;
                background: var(--splash-bg, #121212);
                transition: transform 0.4s cubic-bezier(0.7, 0, 0.3, 1);
              }
              .splash-panel-top { top: 0; }
              .splash-panel-bottom { bottom: 0; }
              #__splash.is-exiting .splash-panel-top { transform: translateY(-100%); }
              #__splash.is-exiting .splash-panel-bottom { transform: translateY(100%); }

              .splash-logo-wrap {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: clamp(14px, 3vw, 22px);
                transition: opacity 0.18s ease, transform 0.18s ease;
              }

              .splash-symbol {
                display: block;
                width: clamp(72px, 14vw, 104px);
                height: auto;
                fill: var(--splash-fg, #ffffff);
              }
              /* transform-box: view-box 로 원점을 뷰박스 중앙에 고정한다.
                 기본값이면 패스별 바운딩박스가 기준이라 조각마다 따로 논다. */
              .splash-mono,
              .splash-orbit {
                transform-box: view-box;
                transform-origin: 50% 50%;
              }
              .splash-mono {
                animation: splashMono 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
              }
              /* 궤도 링은 살짝 늦게, 돌면서 자리를 잡는다 */
              .splash-orbit {
                animation: splashOrbit 0.44s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
              }
              @keyframes splashMono {
                from { opacity: 0; transform: scale(0.74); }
                to { opacity: 1; transform: scale(1); }
              }
              @keyframes splashOrbit {
                from { opacity: 0; transform: scale(1.3) rotate(-16deg); }
                to { opacity: 1; transform: scale(1) rotate(0deg); }
              }
              #__splash.is-exiting .splash-logo-wrap {
                opacity: 0;
                transform: scale(0.97);
              }

              .splash-logo {
                display: block;
                font-family: var(--font-barlow-condensed), 'Arial Narrow', sans-serif;
                font-size: clamp(22px, 5vw, 32px);
                font-weight: 700;
                letter-spacing: 0.3em;
                text-transform: uppercase;
                color: var(--splash-fg, #ffffff);
                /* 브랜드 레드 하이라이트가 워드마크 위를 한 번 훑고 지나간다 */
                background-image: linear-gradient(
                  100deg,
                  var(--splash-fg, #ffffff) 42%,
                  var(--splash-shine, #d6303b) 50%,
                  var(--splash-fg, #ffffff) 58%
                );
                /* 300% 폭 그라데이션을 100%→0%로 밀면 글자는 항상 덮인 채
                   하이라이트 띠만 좌→우로 지나간다. 범위를 벗어나면 글자가 잘린다. */
                background-size: 300% 100%;
                background-repeat: no-repeat;
                background-position: 0% 0;
                animation: splashRush 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
              }
              /* background-clip: text 미지원 시 단색 텍스트로 남는다 */
              @supports (background-clip: text) or (-webkit-background-clip: text) {
                .splash-logo {
                  -webkit-background-clip: text;
                  background-clip: text;
                  -webkit-text-fill-color: transparent;
                  animation:
                    splashRush 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both,
                    splashShine 0.34s ease-out 0.34s both;
                }
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
              @keyframes splashShine {
                from { background-position: 100% 0; }
                to { background-position: 0% 0; }
              }

              /* ── 재생 모드 ──────────────────────────────────────────────
                 게이트에서 컬렉션으로 들어갈 때 SplashTransition 이 붙이는 상태다.
                 커튼이 닫혀서 이동을 덮고, 도착하면 다시 열린다.
                 is-open = 커튼이 화면 밖(열린 상태). 떼면 닫히고, 다시 붙이면 열린다. */
              #__splash.is-replay {
                /* 세션당 1회 규칙으로 박히는 display:none!important 를 이긴다 */
                display: flex !important;
              }
              #__splash.is-replay .splash-panel {
                /* SplashTransition 의 CLOSE_MS·OPEN_MS 와 같은 값이어야 한다 */
                transition: transform 0.22s cubic-bezier(0.7, 0, 0.3, 1);
              }
              #__splash.is-replay.is-open .splash-panel-top { transform: translateY(-100%); }
              #__splash.is-replay.is-open .splash-panel-bottom { transform: translateY(100%); }

              /* 로고 등장 애니메이션은 0.5초 안에 끝나지 않아 잘린 것처럼 보인다.
                 재생 모드에서는 끄고 커튼과 같은 박자로 페이드만 시킨다. */
              #__splash.is-replay .splash-mono,
              #__splash.is-replay .splash-orbit,
              #__splash.is-replay .splash-logo {
                animation: none;
              }
              #__splash.is-replay .splash-logo-wrap {
                animation: none;
                opacity: 1;
                transition: opacity 0.16s ease, transform 0.16s ease;
              }
              #__splash.is-replay.is-open .splash-logo-wrap {
                opacity: 0;
                transform: scale(0.97);
              }

              /* 커튼을 시작 위치에 앉히는 한 프레임 동안만 트랜지션을 끊는다 */
              #__splash.no-anim .splash-panel,
              #__splash.no-anim .splash-logo-wrap {
                transition: none !important;
              }

              @media (prefers-reduced-motion: reduce) {
                .splash-logo,
                .splash-mono,
                .splash-orbit { animation: none !important; }
                .splash-panel,
                .splash-logo-wrap { transition: none !important; }
                #__splash { transition: opacity 0.2s linear; }
                #__splash.is-exiting { opacity: 0; }
                #__splash.is-exiting .splash-panel-top,
                #__splash.is-exiting .splash-panel-bottom { transform: none; }
                #__splash.is-exiting .splash-logo-wrap { opacity: 1; transform: none; }
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var HOLD=700,EXIT=380;function h(){var e=document.getElementById('__splash');if(!e)return;e.style.pointerEvents='none';e.classList.add('is-exiting');setTimeout(function(){e.style.display='none';},EXIT);}function go(){setTimeout(h,HOLD);}if(document.readyState!=='loading'){go();}else{document.addEventListener('DOMContentLoaded',go);}})();`,
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
            <Analytics />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
