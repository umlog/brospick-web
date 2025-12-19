import Image from 'next/image';
import styles from './footer.module.css';
import symbolImg from '../../styles/txtlogo.svg';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Image
            src={symbolImg}
            alt="Brospick"
            className={styles.logo}
          />
          <p>
            실력은 충분하지만
            <br />
            환경과 인맥, 노출 부족으로 기회조차 얻지 못하는 선수들이 있기 때문이다.
          </p>
        </div>

        <div className={styles.links}>
          <a href="https://instagram.com/brospick.official" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="mailto:contact@brospick.com">Email</a>
        </div>

        <div className={styles.bottom}>
          <p>© {year} BROSPICK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
