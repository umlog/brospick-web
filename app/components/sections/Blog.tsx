import Link from 'next/link';
import Image from 'next/image';
import styles from './blog.module.css';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/domain/types';

async function getLatestPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, player_name, team, position, excerpt, image, status, date')
    .order('id', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[Blog section] fetch error:', error);
    return [];
  }

  return data as BlogPost[];
}

export default async function Blog() {
  const featuredPosts = await getLatestPosts();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Blog</h2>

        <div className={styles.grid}>
          {featuredPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/interviews/${post.id}`}
              className={styles.card}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.imageContainer}>
                <Image
                  src={post.image}
                  alt={post.player_name}
                  fill
                  className={styles.image}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.name}>{post.player_name}</h3>
                <p className={styles.meta}>
                  {post.team} · {post.position}
                </p>
                <p className={styles.excerpt}>{post.excerpt}</p>
                <span className={styles.readMore}>더 알아보기</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
