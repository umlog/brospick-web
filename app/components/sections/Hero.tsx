'use client';

import Image from 'next/image';
import styles from './hero.module.css';
import heroBg from '../../styles/hero-bg2.jpg';
import txtLogo from '../../styles/txtlogo.svg';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bgWrapper}>
        <Image
          src={heroBg}
          alt=""
          className={styles.bgImage}
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div className={styles.logoWrapper}>
        <Image
          src={txtLogo}
          alt="Brospick"
          className={styles.logo}
          width={420}
          height={150}
          priority
        />
      </div>

      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
