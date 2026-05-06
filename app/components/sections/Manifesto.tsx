import Image from 'next/image';
import styles from './manifesto.module.css';
import ScrollReveal from '../animations/ScrollReveal';
import heroBg from '../../styles/hero-bg2.jpg';
import symbolImg from '../../styles/symbol.png';

const cards = [
  {
    number: '01',
    title: '브로스픽의 철학',
    content: '브로스픽은 한국 축구 선수들이 마주한 현실적인 한계를 깨기 위해 탄생했습니다. 선수를 위한 새로운 시스템이 필요하다는 믿음에서 시작됐습니다.',
  },
  {
    number: '02',
    title: '문제를 직시하다',
    content: '국내 선수들은 불공정한 구조 속에서 기회를 얻지 못하고 잠재력을 잃고 있습니다. 우리는 이런 현실이 잘못되었다고 판단했습니다.',
  },
  {
    number: '03',
    title: '다음 주인공은 당신입니다',
    content: '더 이상 국내 시스템의 한계 속에서 꿈을 포기하지 마세요. 브로스픽을 통해 당신의 이야기를 세계에 보여주세요.',
  },
];

export default function Manifesto() {
  return (
    <section id="manifesto" className={styles.manifesto}>
      {/* 배경 이미지 */}
      <div className={styles.bgWrapper}>
        <Image
          src={heroBg}
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          priority={false}
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* 심볼 워터마크 */}
      <div className={styles.symbolWrapper}>
        <Image
          src={symbolImg}
          alt=""
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div className={styles.container}>
        <ScrollReveal direction="up">
          <p className={styles.eyebrow}>BROSPICK</p>
          <h2 className={styles.sectionTitle}>우리가 존재하는 이유</h2>
        </ScrollReveal>

        <div className={styles.cards}>
          {cards.map((card, idx) => (
            <ScrollReveal key={card.number} direction="up" delay={0.1 * idx}>
              <div className={styles.card}>
                <span className={styles.cardNumber}>{card.number}</span>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardContent}>{card.content}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
