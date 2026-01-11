import Image from 'next/image';
import styles from './footer.module.css';
import symbolImg from '../../styles/txtlogo.svg';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <Image
            src={symbolImg}
            alt="Brospick"
            className={styles.logo}
          />
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>지원</h3>
          <ul className={styles.columnList}>
            <li>
              <a href="https://www.instagram.com/team.brospick/" target="_blank" rel="noopener noreferrer">
                인스타그램
              </a>
            </li>
            <li>
              <a href="https://www.threads.com/@team.brospick?" target="_blank" rel="noopener noreferrer">
                스레드
              </a>
            </li>
            <li>
              <a href="mailto:team.brospick@gmail.com">이메일 문의</a>
            </li>
            <li>개인 정보 보호 정책</li>
            <li>쿠키 정책</li>
            <li>면책 조항</li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>BROSPICK</h3>
          <ul className={styles.columnList}>
            <li>회사: BROSPICK</li>
            <li>대표자: 홍주영</li>
            <li>사업자번호: </li>
            <li>주소: 경기도 파주시 금정20길 19,<br />504동 5층 n161호 (금촌동, 세성빌딩)</li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <p>© {year} BROSPICK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
