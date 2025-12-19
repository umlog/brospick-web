'use client';

import styles from './project.module.css';

const activities = [
  {
    title: '무명 대학 선수, 성인 선수, 하부리그 선수들을 직접 찾아감',
    description: '시스템이 놓친 선수들을 발굴합니다.',
  },
  {
    title: '릴스: 현장 인터뷰 + 플레이 영상',
    description: '실제 선수의 현재를 보여줍니다.',
  },
  {
    title: '피드: 프로필, 스토리, 배경',
    description: '선수의 서사를 기록합니다.',
  },
  {
    title: '선수 기록 아카이브 & 커뮤니티의 시작점',
    description: '단순 콘텐츠 계정이 아닌 플랫폼을 구축합니다.',
  },
];

export default function Project() {
  return (
    <section id="project" className={styles.project}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>시스템이 놓친 선수를 우리가 선택한다</h2>

        <div className={styles.mainContent}>
          <h3 className={styles.englishSlogan}>
            WE PICK
            <br />
            THE UNSEEN
          </h3>
          
          <p className={styles.koreanMessage}>
            우리는 유명한 선수가 아니라
            <br />
            사라지기엔 아까운 선수를 고른다.
            <br />
            평가가 아니라 발견을 위해서.
          </p>
        </div>

        <div className={styles.grid}>
          {activities.map((activity, idx) => (
            <div key={idx} className={styles.card}>
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
