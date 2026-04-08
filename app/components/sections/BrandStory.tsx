import Image from 'next/image';
import Link from 'next/link';
import styles from './brand-story.module.css';
import ScrollReveal from '../animations/ScrollReveal';

export default function BrandStory() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.imageCol}>
          <ScrollReveal direction="up">
            <div className={styles.imageWrap}>
              <Image
                src="/apparel/training-top/half-zip/half-zip-training-top/thumb.png"
                alt="브로스픽 스포츠웨어"
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>

        <div className={styles.textCol}>
          <ScrollReveal direction="up" delay={0.1}>
            <p className={styles.eyebrow}>BROSPICK SPORTSWEAR</p>
            <h2 className={styles.heading}>
              브로스픽은 선수의 움직임에<br />맞게 설계합니다.
            </h2>
            <p className={styles.body}>
              트레이닝의 모든 순간을 함께하는 의류. 경기장 밖에서도 선수다운 스타일을 유지할 수 있도록, 기능성과 디자인을 동시에 담았습니다.
            </p>
            <p className={styles.body}>
              브로스픽 스포츠웨어는 단순한 운동복이 아닙니다. 선수가 자신을 표현하는 방식입니다.
            </p>
            <Link href="/apparel" className={styles.cta}>
              컬렉션 보기 <span>→</span>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
