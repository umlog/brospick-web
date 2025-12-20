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
            무명선수가 유명선수로    Team BrosPick
          </p>
        </div>

        <div className={styles.links}>
          <a href="https://www.instagram.com/team.brospick/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://www.threads.com/@team.brospick?" target="_blank" rel="noopener noreferrer">
            Threads
          </a>
          <a href="mailto:team.brospick@gmail.com">Email</a>
        </div>

        <div className={styles.companyInfo}>
          <p>회사: BROSPICK</p>
          <p>대표자: 홍주영</p>
          <p>
            주소: 경기도 파주시 금정20길 19, 504동 5층 n161호 (금촌동, 세성빌딩)
          </p>
        </div>

        <div className={styles.bottom}>
          <p>© {year} BROSPICK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
