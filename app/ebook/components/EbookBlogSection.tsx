'use client';

import Link from 'next/link';
import Image from 'next/image';
import ScrollReveal from '@/app/components/animations/ScrollReveal';
import styles from '../ebook-page.module.css';
import type { BlogPost } from '@/lib/domain/types';

interface EbookBlogSectionProps {
  posts: BlogPost[];
}

export default function EbookBlogSection({ posts }: EbookBlogSectionProps) {
  return (
    <section className={styles.blogSection}>
      <div className={styles.sectionInner}>
        <ScrollReveal direction="up">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>BROSPICK BLOG</p>
            <h2 className={styles.sectionTitle}>함께 읽어보세요</h2>
            <p className={styles.sectionDesc}>
              전자책에 담긴 선수들의 이야기, 직접 만나보세요.
            </p>
          </div>
        </ScrollReveal>

        <div className={styles.blogGrid}>
          {posts.map((post, index) => (
            <ScrollReveal key={post.id} direction="up" delay={index * 0.12}>
              <Link href={`/interviews/${post.id}`} className={styles.blogCard}>
                <div className={styles.blogCardImage}>
                  <Image
                    src={post.image}
                    alt={post.player_name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.blogCardContent}>
                  <p className={styles.blogCardMeta}>
                    {post.team} · {post.position}
                  </p>
                  <h3 className={styles.blogCardName}>{post.player_name}</h3>
                  <p className={styles.blogCardExcerpt}>{post.excerpt}</p>
                  <span className={styles.blogCardRead}>더 알아보기 →</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={0.2}>
          <div className={styles.blogViewAll}>
            <Link href="/interviews" className="btn btn-outline">
              <span>전체 인터뷰 보기</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
