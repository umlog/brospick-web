import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BrandSymbol } from './components/brand/BrandSymbol';
import { SOCIAL_MEDIA } from '../lib/constants';
import styles from './gate.module.css';

/**
 * 메인은 두 갈래를 고르는 게이트다.
 *
 * 방문의 90% 이상이 인스타 프로필 링크를 타고 이 경로에 착지한다.
 * 부츠스킨과 스포츠웨어는 사는 이유가 겹치지 않으므로 한 페이지에 쌓지 않고
 * 여기서 갈라 보낸다. 장바구니·결제·주문은 두 갈래가 그대로 공유한다.
 *
 * 화면 배경을 제품컷 배경색과 같은 값으로 깔아 사진의 경계를 지웠다.
 * 카드 틀이 사라지면서 남는 것은 배경 하나에 놓인 제품 두 개다.
 *
 * 데스크탑과 모바일은 같은 마크업을 다르게 읽는다.
 *   데스크탑 — 좌우 2분할. 사진이 화면을 채우고 이름은 그 아래 앉는다.
 *   모바일   — 링크트리 형태. 로고와 소개 아래로 버튼을 쌓고, 사진은 버튼 안 썸네일로 줄인다.
 *             좁은 화면에서 사진 두 장을 크게 쌓으면 둘 다 어중간해지고, 무엇보다
 *             인스타에서 넘어온 사람이 한 엄지 거리에서 고르지 못한다.
 * 로고·소개·보조 링크는 모바일에서만 나오고 데스크탑에서는 숨는다.
 */

/**
 * public/gate 아래 게이트 전용 자산 — 나란히 놓기 위해 한 세트로 다시 만든 정사각 타일이다.
 *
 * 원본 두 장은 배경색(순백 / 옅은 회색)도 피사체 채움률도 서로 달라, 같은 틀에 넣으면
 * 한쪽만 꽉 차고 다른 쪽은 빈 판처럼 보였다. 같은 배경색·같은 캔버스에 올리고
 * 피사체 크기를 맞춰 두 장의 무게를 맞췄다.
 *
 * 타일은 패널을 꽉 채워(cover) 깐다. contain 으로 안쪽에 앉히면 타일의 네 변이 패널 안에
 * 사각 자국으로 남는다 — 두 컷 모두 모서리보다 가운데가 밝은 스튜디오 비네팅이 있어서,
 * 배경색을 아무리 맞춰도 그 자국은 지워지지 않는다. 꽉 채우면 타일 가장자리가 패널
 * 가장자리와 겹쳐 자국이 생길 자리가 없다. 두 컷 다 상하 여백이 넉넉해 잘려도 안전하다.
 *
 * 원본: bootskin  → /gate/bootskin.png
 *       sportswear→ /apparel/training-top/quarter-zip-training-top/thumb.png
 */
const GATES = [
  {
    href: '/bootskin',
    label: 'BOOT SKIN',
    // 모바일 버튼에서만 쓴다 — 이름만으로는 무엇을 파는지 모르는 사람이 많다
    note: '축구화에 붙이는 스킨',
    image: '/gate/bootskin-card.png',
    alt: '부츠스킨을 붙인 흰색 축구화',
  },
  {
    href: '/apparel',
    label: 'SPORTSWEAR',
    note: '훈련용 기능성 웨어',
    image: '/gate/sportswear-card.png',
    alt: '브로스픽 쿼터집 트레이닝 탑',
  },
] as const;

/** 모바일에서 버튼 아래 붙는 보조 링크 */
const EXTRAS = [
  { href: '/tracking', label: '주문 조회' },
  { href: '/review', label: '리뷰 작성' },
  { href: '/story', label: '브랜드 이야기' },
] as const;

export const metadata: Metadata = {
  title: '브로스픽 BROSPICK | 부츠스킨 · 스포츠웨어',
  description:
    '축구화에 붙이는 부츠스킨과 기능성 스포츠웨어를 만드는 브로스픽입니다. 원하는 쪽을 골라 들어가세요.',
};

export default function Home() {
  return (
    <div className={styles.gate}>
      <h1 className={styles.srOnly}>
        브로스픽 BROSPICK — 축구화 부츠스킨과 스포츠웨어
      </h1>

      <div className={styles.intro} aria-hidden="true">
        <BrandSymbol size="52px" className={styles.introMark} />
        <p className={styles.introName}>BROSPICK</p>
        <p className={styles.introTag}>축구화 부츠스킨 · 기능성 스포츠웨어</p>
      </div>

      <nav className={styles.panels} aria-label="컬렉션 선택">
        {/* data-splash-nav: SplashTransition 이 이 링크만 가로채 스플래시를 한 번 더 재생한다 */}
        {GATES.map((gate) => (
          <Link key={gate.href} href={gate.href} className={styles.panel} data-splash-nav>
            <span className={styles.media}>
              <Image
                src={gate.image}
                alt={gate.alt}
                fill
                sizes="(max-width: 768px) 64px, 50vw"
                className={styles.image}
                priority
              />
            </span>
            <span className={styles.caption}>
              <span className={styles.label}>{gate.label}</span>
              <span className={styles.note}>{gate.note}</span>
            </span>
            <svg
              className={styles.chevron}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </nav>

      <div className={styles.extras}>
        <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" className={styles.extraLink}>
          인스타그램
        </a>
        {EXTRAS.map((extra) => (
          <Link key={extra.href} href={extra.href} className={styles.extraLink}>
            {extra.label}
          </Link>
        ))}
      </div>

      <div className={styles.base}>
        <Link href="/story" className={styles.baseLink}>BROSPICK</Link>
      </div>
    </div>
  );
}
