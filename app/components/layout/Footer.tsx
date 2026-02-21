import Image from 'next/image';
import { CONTACT, COMPANY, SOCIAL_MEDIA } from '../../../lib/constants';
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
              <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer">
                인스타그램
              </a>
            </li>
            <li>
              <a href={SOCIAL_MEDIA.threads} target="_blank" rel="noopener noreferrer">
                스레드
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`}>이메일 문의</a>
            </li>
            <li>개인 정보 보호 정책</li>
            <li>쿠키 정책</li>
            <li>면책 조항</li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>{COMPANY.name}</h3>
          <ul className={styles.columnList}>
            <li>회사: {COMPANY.name}</li>
            <li>대표자: {COMPANY.representative}</li>
            <li>사업자번호: {COMPANY.businessNumber}</li>
            <li>통신판매업: {COMPANY.communicationSalesNumber}</li>
            <li>주소: {COMPANY.address}</li>
            <li style={{ whiteSpace: 'nowrap' }}>개인정보보호 책임자: {COMPANY.privacyOfficer}</li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <p>© {year} {COMPANY.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
