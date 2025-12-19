'use client';

import styles from './future.module.css';

const roadmap = [
  {
    stage: 'PICKED.',
    title: '선수 스토리와 기록을 축적하는 미디어',
    description: '콘텐츠 수집, 플레이어 데이터베이스 구축',
  },
  {
    stage: 'SEEN.',
    title: '선수 데이터와 하이라이트가 쌓이는 플랫폼 (PICKER)',
    description: '플레이어 검색/탐색 시스템, 성과 기록',
  },
  {
    stage: 'PROVEN.',
    title: '팀 단체복·의류·스폰저십까지 연결되는 선수 기반 브랜드',
    description: '전체 에코시스템 구축, 선수 비즈니스 기회 확대',
  },
];

export default function Future() {
  return (
    <section id="future" className={styles.future}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>선수를 무대로 연결하는 브랜드</h2>

        <div className={styles.roadmap}>
          {roadmap.map((item, idx) => (
            <div key={idx} className={styles.roadmapItem}>
              <div className={styles.roadmapHeader}>
                <span className={styles.stage}>{item.stage}</span>
              </div>
              <h3 className={styles.roadmapTitle}>{item.title}</h3>
              <p className={styles.roadmapDescription}>{item.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.philosophy}>
          <p className={styles.philosophyText}>
            선수가 성장하면, 브로스픽도 함께 성장한다
          </p>
        </div>
      </div>
    </section>
  );
}

