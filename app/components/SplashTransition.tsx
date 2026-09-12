'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * 게이트에서 컬렉션으로 들어갈 때 스플래시를 한 번 더 재생한다.
 *
 * 첫 진입 스플래시(layout.tsx 의 #__splash)를 그대로 재사용한다 — 커튼이 닫혀서
 * 이동을 덮고, 도착하면 다시 열린다. 로고 등장 애니메이션은 0.5초 안에 끝나지
 * 않으므로 재생 모드에서는 끄고, 커튼과 같은 트랜지션으로 페이드만 시킨다.
 *
 * 대상은 data-splash-nav 가 붙은 링크뿐이다. 상품·장바구니·결제처럼 반복해서
 * 오가는 경로까지 덮으면 구매 흐름이 매번 막힌다.
 *
 * 링크에 직접 핸들러를 달지 않고 document 캡처 단계에서 가로챈다.
 * 그래야 게이트 페이지가 서버 컴포넌트로 남는다.
 */

// 아래 두 값은 layout.tsx 의 `#__splash.is-replay .splash-panel` 트랜지션 시간과 같아야 한다
const CLOSE_MS = 220;
const OPEN_MS = 220;
// 도착 화면이 늦게 그려져도 커튼이 닫힌 채로 갇히지 않게 하는 상한
const NAV_TIMEOUT_MS = 1200;

const SPLASH_CFG_KEY = 'splash_cfg';

// 어드민에서 스플래시를 꺼두면 재생도 하지 않는다. SplashController 가 쓰는 캐시를 그대로 읽는다.
function splashEnabled() {
  try {
    const cached = localStorage.getItem(SPLASH_CFG_KEY);
    if (!cached) return true;
    return (JSON.parse(cached) as { enabled: boolean }).enabled !== false;
  } catch {
    return true;
  }
}

export function SplashTransition() {
  const router = useRouter();
  const pathname = usePathname();
  // 경로가 바뀌는 시점에 실행할 "커튼 열기". 이동이 끝나기 전에는 열면 안 된다.
  const openCurtainRef = useRef<(() => void) | null>(null);

  // 경로가 바뀌었다 = 도착했다. 기다리던 커튼 열기를 실행한다.
  useEffect(() => {
    const open = openCurtainRef.current;
    if (!open) return;
    openCurtainRef.current = null;
    open();
  }, [pathname]);

  useEffect(() => {
    const timers: number[] = [];

    const handleClick = (event: MouseEvent) => {
      // 새 탭·새 창으로 여는 클릭은 그대로 둔다
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a[data-splash-nav]') as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const splash = document.getElementById('__splash');
      if (!splash || !splashEnabled()) return;

      // 모션을 줄인 환경에서는 덮지 않고 그냥 보낸다
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Next 의 Link 핸들러보다 먼저 가로챈다 — 이동 시점을 우리가 잡아야 한다
      event.preventDefault();
      event.stopPropagation();

      // 첫 진입 때 인라인으로 박힌 display:none 을 풀고, 커튼을 화면 밖에 둔 채로 띄운다
      splash.style.removeProperty('display');
      splash.classList.remove('is-exiting');
      splash.classList.add('is-replay', 'is-open', 'no-anim');
      // 시작 위치를 확정시킨다. 이 줄이 없으면 브라우저가 두 상태를 한 번에 계산해 커튼이 순간이동한다.
      void splash.offsetWidth;
      splash.classList.remove('no-anim');
      splash.classList.remove('is-open'); // 커튼 닫힘 시작

      timers.push(
        window.setTimeout(() => {
          openCurtainRef.current = () => {
            splash.classList.add('is-open'); // 커튼 열림 시작
            timers.push(
              window.setTimeout(() => {
                splash.classList.remove('is-replay', 'is-open');
                splash.style.display = 'none';
              }, OPEN_MS)
            );
          };

          router.push(href);

          timers.push(
            window.setTimeout(() => {
              const open = openCurtainRef.current;
              if (!open) return;
              openCurtainRef.current = null;
              open();
            }, NAV_TIMEOUT_MS)
          );
        }, CLOSE_MS)
      );
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      timers.forEach(window.clearTimeout);
    };
  }, [router]);

  return null;
}
