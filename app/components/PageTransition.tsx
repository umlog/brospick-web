'use client';

import { usePathname } from 'next/navigation';

// framer-motion 제거: 라우트 변경 시 key 변경으로 main을 리마운트해
// globals.css의 pageEnter 키프레임 애니메이션(fade + slide)을 재생한다.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className="pageTransition">
      {children}
    </main>
  );
}
