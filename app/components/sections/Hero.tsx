'use client';

import Image from 'next/image';
import styles from './hero.module.css';
import symbolImg from '../../styles/symbol.png';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bgWrapper}>
        <Image
          src={symbolImg}
          alt=""
          className={styles.bgSymbol}
          priority
        />
      </div>
      <div className={styles.overlay} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          NOT EVERY TALENT
          <br />
          GETS A STAGE
        </h1>

        <p className={styles.subtitle}>
          실력은 충분하지만 환경과 인맥, 노출 부족으로 기회조차 얻지 못하는 선수들이 있기 때문이다.
        </p>

        <div className={styles.ctas}>
          <a href="#project" className={styles.ctaPrimary}>
            더 알아보기
          </a>
          {/* <button className={styles.ctaSecondary}>픽커 앱 사전등록</button> */}
        </div>
      </div>
    </section>
  );
}
