'use client';

import { useState } from 'react';
import { BOOTSKIN_FAQ } from '../bootskin.config';
import styles from '../bootskin-page.module.css';

/** 답변 문자열의 `**강조**` 구간을 <strong>으로 바꾼다 (HTML 주입 없이) */
export function renderFaqAnswer(answer: string) {
  return answer
    .split('**')
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

export default function BootskinFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={styles.faqList}>
      {BOOTSKIN_FAQ.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.q} className={styles.faqItem}>
            <button
              className={styles.faqTrigger}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span className={styles.faqQuestion}>Q. {item.q}</span>
              <svg
                className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && <p className={styles.faqAnswer}>{renderFaqAnswer(item.a)}</p>}
          </div>
        );
      })}
    </div>
  );
}
