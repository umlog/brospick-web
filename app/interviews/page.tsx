export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from './interviews-page.module.css';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/domain/types';

async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, player_name, team, position, excerpt, image, status, date')
    .order('id', { ascending: true });

  if (error) {
    console.error('[interviews] fetch error:', error);
    return [];
  }

  return data as BlogPost[];
}

export default async function InterviewsPage() {
  const posts = await getBlogPosts();

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>블로그</h1>
          </div>

          <div className={styles.playersGrid}>
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/interviews/${post.id}`}
                className={styles.playerCard}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={post.image}
                    alt={post.player_name}
                    fill
                    className={styles.playerImage}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.playerName}>{post.player_name}</h2>
                  <p className={styles.playerMeta}>
                    {post.team} · {post.position}
                  </p>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <span className={styles.readMore}>더 알아보기</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
  );
}
