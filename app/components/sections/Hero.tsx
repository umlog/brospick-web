'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './hero.module.css';
import heroBg from '../../styles/hero-bg2.jpg';
import txtLogo from '../../styles/txtlogo.svg';
import { CONTACT } from '../../../lib/constants';

const GROUP_ORDER_MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent('[단체주문 문의] 단체명을 입력해주세요')}&body=${encodeURIComponent(
  '안녕하세요, BROSPICK 단체주문 문의드립니다.\n\n' +
  '단체명 / 소속: \n' +
  '담당자 이름: \n' +
  '연락처: \n' +
  '주문 수량 (인원): \n' +
  '희망 제품: \n' +
  '희망 수령일: \n' +
  '기타 문의사항: \n'
)}`;

export default function Hero() {
  const [showModal, setShowModal] = useState(false);

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

      <button
        className={styles.logoWrapper}
        onClick={() => setShowModal(true)}
        aria-label="단체주문 문의"
      >
        <Image
          src={txtLogo}
          alt="Brospick"
          className={styles.logo}
          width={420}
          height={150}
          priority
        />
      </button>

      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)} aria-label="닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <p className={styles.modalBadge}>단체주문</p>
            <h2 className={styles.modalTitle}>함께하면 더 특별하게</h2>
            <p className={styles.modalDesc}>
              10인 이상 단체 주문은 별도 상담을 통해<br />
              최적의 조건으로 진행해 드립니다.
            </p>
            <div className={styles.modalActions}>
              <a href={GROUP_ORDER_MAILTO} className={styles.modalBtn}>
                이메일 문의
                <span className={styles.modalBtnSub}>{CONTACT.email}</span>
              </a>
              <a href={`tel:${CONTACT.phone}`} className={styles.modalBtn}>
                전화 문의
                <span className={styles.modalBtnSub}>{CONTACT.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
