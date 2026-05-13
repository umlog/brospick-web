import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { EBOOK } from './ebook.config';
import EbookPurchaseDialog from './components/EbookPurchaseDialog';
import EbookBlogSection from './components/EbookBlogSection';
import EbookToc from './components/EbookToc';
import EbookFaq from './components/EbookFaq';
import EbookBook3D from '@/app/components/EbookBook3D';
import styles from './ebook-page.module.css';
import type { BlogPost } from '@/lib/domain/types';

export const metadata: Metadata = {
  title: EBOOK.seoTitle,
  description: EBOOK.seoDescription,
};

async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, player_name, team, position, excerpt, image, status, date')
    .order('id', { ascending: false })
    .limit(6);

  if (error) return [];
  return data as BlogPost[];
}

const BENEFIT_ICONS = [
  <svg key="pen" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>,
  <svg key="clock" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>,
  <svg key="people" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>,
];

export default async function EbookPage() {
  const blogPosts = await getBlogPosts();

  return (
    <main className={styles.main}>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroInner}>
          {/* 텍스트 영역 */}
          <div className={styles.heroContent}>
            <p className={styles.heroBadge}>{EBOOK.eyebrow}</p>
            <h1 className={styles.heroTitle}>{EBOOK.title}</h1>
            <p className={styles.heroSubtitle}>{EBOOK.subtitle}</p>
            <div className={styles.heroActions}>
              <EbookPurchaseDialog />
              <a href="#contents" className={styles.heroSecondary}>
                목차 보기
              </a>
            </div>
            <div className={styles.heroPriceBlock}>
              <div className={styles.priceBadge}>
                <span className={styles.priceBadgeDot} />
                1차 얼리버드 진행중
              </div>
              <div className={styles.priceMainRow}>
                <span className={styles.priceStrike}>₩{EBOOK.originalPrice.toLocaleString()}</span>
                <span className={styles.priceMain}>₩{EBOOK.phase1Price.toLocaleString()}</span>
                <span className={styles.priceSave}>
                  {Math.round((1 - EBOOK.phase1Price / EBOOK.originalPrice) * 100)}% OFF
                </span>
              </div>
              <p className={styles.priceNextNotice}>
                2차 ₩{EBOOK.phase2Price.toLocaleString()} · 3차(정가) ₩{EBOOK.originalPrice.toLocaleString()}으로 순차 인상 예정
              </p>
              <span className={styles.priceFormat}>PDF · 3시간 이내 전자 메일 발송</span>
            </div>
          </div>

          {/* 3D 북 목업 */}
          <div className={styles.heroBookWrapper}>
            <EbookBook3D />
          </div>
        </div>

        <div className={styles.heroStatsBar}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>40</span>
            <span className={styles.heroStatLabel}>페이지</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>9</span>
            <span className={styles.heroStatLabel}>파트</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>PDF</span>
            <span className={styles.heroStatLabel}>포맷</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>2026</span>
            <span className={styles.heroStatLabel}>First Edition</span>
          </div>
        </div>

        <div className={styles.heroScrollIndicator}>
          <div className={styles.heroScrollLine} />
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className={styles.benefits}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>WHY THIS BOOK</p>
            <h2 className={styles.sectionTitle}>{EBOOK.benefitsHeading}</h2>
          </div>
          <div className={styles.benefitsGrid}>
            {EBOOK.benefits.map((b, i) => (
              <div key={b.title} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{BENEFIT_ICONS[i]}</div>
                <h3 className={styles.benefitTitle}>{b.title}</h3>
                <p className={styles.benefitDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TABLE OF CONTENTS ===== */}
      <section className={styles.toc} id="contents">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>CONTENTS</p>
            <h2 className={styles.sectionTitle}>{EBOOK.tocHeading}</h2>
          </div>
          <EbookToc />
        </div>
      </section>

      {/* ===== PACKAGE BENEFITS ===== */}
      <section className={styles.packageBenefits}>
        <div className={styles.sectionInner}>
          <div className={styles.packageBannerList}>
            <div className={styles.packageBanner}>
              <div className={styles.packageBannerLabel}>구매시 혜택 1</div>
              <div className={styles.packageBannerBody}>
                <div className={styles.packageBannerIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <p className={styles.packageBannerTitle}>1:1 선수 면담 포함</p>
                  <p className={styles.packageBannerDesc}>
                    E북을 구매한 인원들에게는 실제 무명선수에서 해외로 진출한 선수들과 1:1 면담을 제공합니다.
                    전반적인 컨설팅을 통한 가이드를 세우는데 도움을 줄 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.packageBanner}>
              <div className={styles.packageBannerLabel}>구매시 혜택 2</div>
              <div className={styles.packageBannerBody}>
                <div className={styles.packageBannerIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div>
                  <p className={styles.packageBannerTitle}>에이전트 컨택 도움</p>
                  <p className={styles.packageBannerDesc}>
                    선수의 경력과 기량이 뛰어나다면 실제 국내 및 해외 에이전트 컨택 및 면담 연결을 통해 팀 계약의 가능성을 제공합니다.
                    <br />
                    <span className={styles.packageBannerNote}>(컨택을 위한 객관적인 데이터와 자료가 반드시 필요합니다.)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.packageBanner}>
              <div className={styles.packageBannerLabel}>구매시 혜택 3</div>
              <div className={styles.packageBannerBody}>
                <div className={styles.packageBannerIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <p className={styles.packageBannerTitle}>전문적 상담</p>
                  <p className={styles.packageBannerDesc}>
                    구매 인원에게는 해외 진출에 전반적인 궁금증을 해결할 수 있는 맞춤 질문상담 진행합니다.
                    <br />
                    <span className={styles.packageBannerNote}>(메일 소통 및 인스타그램 DM)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.faq}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
          </div>
          <EbookFaq />
        </div>
      </section>

      {/* ===== CREDITS ===== */}
      <section className={styles.credits}>
        <div className={styles.sectionInner}>
          <div className={styles.creditsGrid}>
            <div className={styles.creditsGroup}>
              <p className={styles.creditsLabel}>WRITTEN BY</p>
              {EBOOK.authors.filter(a => a.role === 'Main Author').map((a) => (
                <p key={a.name} className={styles.creditsName}>
                  {a.name}
                  {'tag' in a && a.tag && <span className={styles.creditsTag}>{a.tag}</span>}
                </p>
              ))}
            </div>
            <div className={styles.creditsDivider} />
            <div className={styles.creditsGroup}>
              <p className={styles.creditsLabel}>EDITED BY</p>
              {EBOOK.authors.filter(a => a.role === 'Editor').map((a) => (
                <p key={a.name} className={styles.creditsName}>{a.name}</p>
              ))}
            </div>
            <div className={styles.creditsDivider} />
            <div className={styles.creditsGroup}>
              <p className={styles.creditsLabel}>FIELD CONTRIBUTORS</p>
              {EBOOK.fieldContributors.map((c) => (
                <p key={c.name} className={styles.creditsName}>
                  {c.name}
                  <span className={styles.creditsTag}>{c.tag}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BLOG ===== */}
      {blogPosts.length > 0 && <EbookBlogSection posts={blogPosts} />}

    </main>
  );
}
