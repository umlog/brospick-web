'use client';

import { useState } from 'react';
import { EBOOK } from '../ebook.config';
import styles from '../ebook-page.module.css';

export default function EbookToc() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.tocAccordion}>
      <button
        className={styles.tocAccordionTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>목차 전체 보기 ({EBOOK.toc.length}개 파트)</span>
        <svg
          className={`${styles.tocChevron} ${isOpen ? styles.tocChevronOpen : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`${styles.tocAccordionBody} ${isOpen ? styles.tocAccordionBodyOpen : ''}`}>
        <ol className={styles.tocList}>
          {EBOOK.toc.map((item) => (
            <li key={item.chapter} className={styles.tocItem}>
              <span className={styles.tocChapter}>{item.chapter}</span>
              <div className={styles.tocText}>
                <strong className={styles.tocTitle}>{item.title}</strong>
                <span className={styles.tocDesc}>{item.desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
