import Link from 'next/link';
import Image from 'next/image';
import styles from './blog.module.css';
import { players } from '@/app/data/players';

export default function Blog() {
  // 최신 블로그 포스트 3개 (배열을 역순으로 정렬하여 최신 순으로, 그 중 3개만 선택)
  const featuredPosts = [...players].reverse().slice(0, 3);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Blog</h2>

        <div className={styles.grid}>
          {featuredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/interviews/${post.id}`}
              className={styles.card}
            >
              <div className={styles.imageContainer}>
                <Image
                  src={post.image}
                  alt={post.name}
                  fill
                  className={styles.image}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.name}>{post.name}</h3>
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
