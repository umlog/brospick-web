'use client';

import styles from './future.module.css';
import ScrollReveal from '../animations/ScrollReveal';

const roadmap = [
  {
    stage: '01',
    title: '해외리그 진출 서포트',
    description: '해외리그 기회를 얻기 원하는 선수의 진출 기회를 연결합니다.',
  },
  {
    stage: '02',
    title: '개인/팀 웨어',
    description: '각 팀마다 비슷한 디자인 웨어에서 벗어나, 트렌드와 협업으로 새로운 스타일을 제안합니다.',
  },
  {
    stage: '03',
    title: '선수 기록 플랫폼',
    description: '선수 개인 커리어를 기반으로 해외 진출 기회를 연결하는 플레이어 마켓형 플랫폼입니다.',
  },
];

export default function Future() {
  return (
    <section id="future" className={styles.future}>
      <div className={styles.container}>
        <ScrollReveal direction="up">
          <h2 className={styles.sectionTitle}>Our Services</h2>
        </ScrollReveal>

        <div className={styles.grid}>
          {roadmap.map((item, idx) => (
            <ScrollReveal key={idx} direction="up" delay={0.1 * idx}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardNumber}>{item.stage}</div>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

