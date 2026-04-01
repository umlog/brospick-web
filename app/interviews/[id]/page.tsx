import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import VideoEmbed from '../../components/embeds/VideoEmbed';
import styles from './interview-detail.module.css';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/domain/types';

async function getPost(id: string): Promise<BlogPost | null> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', numId)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

export default async function InterviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/interviews" className={styles.backLink}>
          ← 인터뷰 목록으로 돌아가기
        </Link>

        <article className={styles.article}>
          <div className={styles.header}>
            <div className={styles.imageContainer}>
              {(post.profile_image ?? post.image).startsWith('/') ? (
                <Image
                  src={post.profile_image ?? post.image}
                  alt={post.player_name}
                  width={225}
                  height={300}
                  className={styles.profileImage}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.image}>{post.profile_image ?? post.image}</div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h1>{post.player_name}</h1>
              <div className={styles.meta}>
                <span>{post.team}</span>
                <span>·</span>
                <span>{post.position}</span>
                <span>·</span>
                <span className={styles.status}>{post.status}</span>
              </div>
              <p className={styles.date}>{post.date}</p>
            </div>
          </div>

          <div className={styles.highlights}>
            <h3>주요 성과</h3>
            <ul>
              {post.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          {post.video_url && (
            <div className={styles.videoSection}>
              <h3>플레이 영상</h3>
              <VideoEmbed url={post.video_url} autoPlay={false} />
            </div>
          )}

          <div className={styles.content}>
            {post.content.split('\n\n').map((paragraph, index) => {
              // 이미지 처리
              if (paragraph.startsWith('![img]')) {
                const imagePath = paragraph.replace('![img]', '');
                return (
                  <div key={index} className={styles.articleImage}>
                    <Image
                      src={imagePath}
                      alt="Player action"
                      width={800}
                      height={600}
                      className={styles.image}
                      style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    />
                  </div>
                );
              }
              // 마크다운 헤딩 처리
              if (paragraph.startsWith('# ')) {
                return <h1 key={index}>{paragraph.replace('# ', '')}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={index}>{paragraph.replace('## ', '')}</h2>;
              }
              // 인용구 처리 (마크다운 스타일)
              if (paragraph.startsWith('> ')) {
                return <blockquote key={index}>{paragraph.replace('> ', '')}</blockquote>;
              }
              // 인용구 처리 (따옴표 스타일)
              if (paragraph.startsWith('"') && paragraph.endsWith('"')) {
                return <blockquote key={index}>{paragraph}</blockquote>;
              }
              // 테이블 처리
              if (paragraph.includes('|')) {
                const lines = paragraph.split('\n');
                const isTable = lines.length >= 3 && lines[1].includes('-');
                if (isTable) {
                  const rows = lines.map(line => line.split('|').map(cell => cell.trim()).filter(Boolean));
                  return (
                    <div key={index} className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            {rows[0]?.map((cell, i) => <th key={i}>{cell}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(2).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => <td key={j}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              }
              // 리스트 처리
              if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                const lines = paragraph.split('\n');
                const listStartIndex = lines.findIndex(line => line.startsWith('- '));

                if (listStartIndex !== -1) {
                  const beforeList = lines.slice(0, listStartIndex).join('\n');
                  const listItems = lines.slice(listStartIndex).filter(line => line.startsWith('- '));

                  return (
                    <div key={index}>
                      {beforeList && <p><strong>{beforeList}</strong></p>}
                      <ul className={styles.list}>
                        {listItems.map((item, i) => (
                          <li key={i}>{item.replace('- ', '')}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              }
              // 일반 단락
              return <p key={index}>{paragraph}</p>;
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
