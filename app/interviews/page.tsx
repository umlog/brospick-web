import Link from 'next/link';
import styles from './interviews-page.module.css';
import Image from 'next/image';
import { players } from '@/app/data/players';

export default function InterviewsPage() {
  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>블로그</h1>
          </div>

          <div className={styles.playersGrid}>
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/interviews/${player.id}`}
                className={styles.playerCard}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={player.image}
                    alt={player.name}
                    fill
                    className={styles.playerImage}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.playerName}>{player.name}</h2>
                  <p className={styles.playerMeta}>
                    {player.team} · {player.position}
                  </p>
                  <p className={styles.excerpt}>{player.excerpt}</p>
                  <span className={styles.readMore}>더 알아보기</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
  );
}
