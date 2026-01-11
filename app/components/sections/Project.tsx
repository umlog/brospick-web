'use client';

import styles from './project.module.css';
import ScrollReveal from '../animations/ScrollReveal';

const introLines = [
  '시스템이 놓친 선수, 우리가 다시 선택합니다.',
  '우리는 유명한 선수를 찾지 않습니다.',
  '사라지기엔 아까운 선수를 찾습니다.',
  '평가가 아니라, 발견을 위해 움직입니다.',
];

const activities = [
  {
    number: '1',
    title: '선수 발굴',
    description: '무명 대학 선수부터\n성인·하부리그 선수까지 직접 찾습니다',
  },
  {
    number: '2',
    title: '해외 리그 진출 서포트',
    description: '기존 에이전시의 높은 비용 구조를\n변화시킵니다.',
  },
  {
    number: '3',
    title: '선수 홍보',
    description: '의류 협찬 및 인터뷰·플레이 영상으로\n선수를 시장에 노출합니다',
  },
  {
    number: '4',
    title: '브로스픽의 플랫폼화',
    description: '컨텐츠를 넘어, 기록·연결·커뮤니티를\n담은 어플을 준비 중입니다.',
  },
];

export default function Project() {
  return (
    <section id="project" className={styles.project}>
      <div className={styles.container}>
        <ScrollReveal direction="up">
          <h2 className={styles.sectionTitle}>What We Do</h2>
        </ScrollReveal>

        <ScrollReveal direction="up">
          <div className={styles.intro}>
            {introLines.map((line, idx) => (
              <p key={idx} className={styles.introLine}>{line}</p>
            ))}
          </div>
        </ScrollReveal>

        <div className={styles.grid}>
          {activities.map((activity, idx) => (
            <ScrollReveal key={idx} direction="up" delay={0.1 * idx}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardNumber}>{activity.number}</div>
                  <h3>{activity.title}</h3>
                </div>
                <p>{activity.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
