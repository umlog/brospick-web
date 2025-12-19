'use client';

import styles from './manifesto.module.css';

export default function Manifesto() {
  return (
    <section id="reality" className={styles.manifesto}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>보이지 않는 재능의 현실을 드러낸다</h2>

        <div className={styles.mainContent}>
          <h3 className={styles.englishSlogan}>
            NOT EVERY TALENT
            <br />
            GETS A STAGE
          </h3>
          
          <p className={styles.koreanMessage}>
            실력은 충분하지만
            <br />
            환경과 인맥, 노출 부족으로
            <br />
            기회조차 얻지 못하는 선수들이 있기 때문이다.
          </p>
        </div>
      </div>
    </section>
  );
}
