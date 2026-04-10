'use client';
import { useState } from 'react';
import Image from 'next/image';
import { CONTACT, COMPANY, SOCIAL_MEDIA } from '../../../lib/constants';
import { LegalModal, type LegalModalType } from '../LegalModal';
import styles from './footer.module.css';
import symbolImg from '../../styles/txtlogo.svg';

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.column}>
      <button
        className={styles.sectionHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.columnTitle}>{title}</span>
        <span className={`${styles.sectionToggle} ${open ? styles.sectionToggleOpen : ''}`}>+</span>
      </button>
      <div className={`${styles.sectionBody} ${open ? styles.sectionBodyOpen : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.container}>
            <FooterSection title="고객서비스">
            <ul className={styles.columnList}>
              <li><a href="/tracking">주문 조회</a></li>
              <li><a href="/returns">교환 / 반품 신청</a></li>
            </ul>
          </FooterSection>

          <FooterSection title="지원">
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
              <li>
                <a href={`tel:${CONTACT.phone}`}>전화 문의</a>
              </li>
              <li>
                <button className={styles.legalBtn} onClick={() => setLegalModal('privacy')}>
                  개인정보 처리방침
                </button>
              </li>
              <li>
                <button className={styles.legalBtn} onClick={() => setLegalModal('cookie')}>
                  쿠키 정책
                </button>
              </li>
              <li>
                <button className={styles.legalBtn} onClick={() => setLegalModal('disclaimer')}>
                  면책 조항
                </button>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title={COMPANY.name}>
            <ul className={styles.columnList}>
              <li>회사: {COMPANY.name}</li>
              <li>대표자: {COMPANY.representative}</li>
              <li>사업자번호: {COMPANY.businessNumber}</li>
              <li>통신판매업: {COMPANY.communicationSalesNumber}</li>
              <li>주소: {COMPANY.address}</li>
              <li>전화번호: {CONTACT.phone}</li>
              <li style={{ whiteSpace: 'nowrap' }}>개인정보보호 책임자: {COMPANY.privacyOfficer}</li>
            </ul>
          </FooterSection>
        </div>

        <div className={styles.bottom}>
          <div className={styles.bottomContainer}>
            <Image src={symbolImg} alt="Brospick" className={styles.logo} />
            <p>© {year} {COMPANY.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {legalModal && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </>
  );
}
