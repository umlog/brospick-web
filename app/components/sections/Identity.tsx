import Image from 'next/image';
import Link from 'next/link';
import styles from './identity.module.css';
import ScrollReveal from '../animations/ScrollReveal';
import { supabase } from '@/lib/supabase';
import { SOCIAL_MEDIA } from '@/lib/constants';

// 배경·심볼은 public/ 아래 경로 문자열로 참조한다.
// import로 가져오면 /_next/static/media/... 가 되는데, 커스텀 image-loader가
// 그 경로를 존재하지 않는 /_opt/_next/... 로 바꿔버려 이미지가 깨진다.
// public/ 아래여야 scripts/gen-opt.mjs가 webp 버킷을 만들어 준다.
const HERO_BG = '/brand/hero-bg2.jpg';
const SYMBOL = '/brand/symbol.png';

// 메인의 "우리가 존재하는 이유 / What We Do / Our Services" 세 섹션을 하나로 합친 섹션.
// 선수가 브로스픽을 거치는 여정 3단계(발굴 → 홍보 → 진출)를 보여주고,
// 각 단계마다 사이트 안의 실제 증거로 연결한다. 마지막에 인스타 큐레이션 스트립.

const MAX_POSTS = 6;

interface CuratedPost {
  id: number;
  post_url: string;
  image_url: string;
  caption: string | null;
  is_video: boolean;
}

const steps = [
  {
    number: '01',
    label: 'DISCOVER',
    title: '발굴',
    description:
      '무명 대학 선수부터 성인·하부리그 선수까지, 경기장을 직접 찾아가 봅니다. 기록이 아니라 사람을 먼저 봅니다.',
    href: '/interviews',
    linkLabel: '우리가 찾은 선수들',
    external: false,
  },
  {
    number: '02',
    label: 'SPOTLIGHT',
    title: '홍보',
    description:
      '의류 협찬과 인터뷰, 플레이 영상으로 선수를 시장에 노출합니다. 보이지 않으면 기회도 오지 않습니다.',
    href: SOCIAL_MEDIA.instagram,
    linkLabel: '@team.brospick',
    external: true,
  },
  {
    number: '03',
    label: 'CONNECT',
    title: '진출',
    description:
      '기존 에이전시의 높은 비용 구조를 바꿔, 해외 리그와 선수를 직접 연결합니다.',
    href: '/ebook',
    linkLabel: '해외 진출 플레이북',
    external: false,
  },
];

async function getCuratedPosts(): Promise<CuratedPost[]> {
  const { data, error } = await supabase
    .from('instagram_posts')
    .select('id, post_url, image_url, caption, is_video')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(MAX_POSTS);

  if (error) {
    console.error('[Identity section] instagram fetch error:', error.message);
    return [];
  }

  return data as CuratedPost[];
}

export default async function Identity() {
  const posts = await getCuratedPosts();

  return (
    <section id="about" className={styles.identity}>
      <div className={styles.bgWrapper}>
        <Image
          src={HERO_BG}
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 75%' }}
          priority={false}
        />
        <div className={styles.bgOverlay} />
      </div>

      <div className={styles.symbolWrapper}>
        <Image src={SYMBOL} alt="" fill sizes="(max-width: 768px) 320px, 560px" style={{ objectFit: 'contain' }} />
      </div>

      <div className={styles.container}>
        <ScrollReveal direction="up">
          <p className={styles.eyebrow}>WHO WE ARE</p>
          <h2 className={styles.heading}>
            시스템이 놓친 선수,<br />우리가 다시 선택합니다.
          </h2>
          <p className={styles.lead}>
            우리는 유명한 선수를 찾지 않습니다. 사라지기엔 아까운 선수를 찾습니다.
            평가가 아니라 발견을 위해 움직입니다.
          </p>
        </ScrollReveal>

        <div className={styles.steps}>
          {steps.map((step, idx) => (
            <ScrollReveal key={step.number} direction="up" delay={0.1 * idx} className={styles.stepReveal}>
              <article className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.description}</p>
                {step.external ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.stepLink}
                  >
                    {step.linkLabel} <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <Link href={step.href} className={styles.stepLink}>
                    {step.linkLabel} <span aria-hidden="true">→</span>
                  </Link>
                )}
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up">
          <div className={styles.feed}>
            <div className={styles.feedHeader}>
              <div>
                <p className={styles.feedEyebrow}>ON THE GROUND</p>
                <h3 className={styles.feedTitle}>현장은 인스타그램에 있습니다</h3>
              </div>
              <a
                href={SOCIAL_MEDIA.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.feedCta}
              >
                @team.brospick <span aria-hidden="true">→</span>
              </a>
            </div>

            {posts.length > 0 && (
              <ul className={styles.feedGrid}>
                {posts.map((post) => (
                  <li key={post.id} className={styles.feedItem}>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.feedLink}
                    >
                      <Image
                        src={post.image_url}
                        alt={post.caption ?? '브로스픽 인스타그램 게시물'}
                        fill
                        sizes="(max-width: 768px) 50vw, 16vw"
                        style={{ objectFit: 'cover' }}
                      />
                      {post.is_video && <span className={styles.playBadge} aria-hidden="true" />}
                      {post.caption && <span className={styles.feedCaption}>{post.caption}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
