'use client';

import { useState } from 'react';
import styles from '../ebook-page.module.css';

const FAQ_ITEMS = [
  {
    q: '이 책은 누가 읽어야 하나요?',
    a: '이 책은 해외 경력이 있고 기량이 뛰어나 검증이 필요없는 선수들을 위한 책이 아닙니다.\n저희와 같은 무명선수였고, 해외 진출 경험이 없거나 혹은 트라이얼 정도인 선수들을 위한 책입니다.\n즉, 대학 수준의 선수들 그리고 세미프로 급 선수 마지막으로 아직 성인이 되지 않은 학생선수들을 위한 가이드 북입니다.',
  },
  {
    q: '이 책 하나로 해외 진출이 정말 가능한가요?',
    a: '책을 읽는다고 해서 해외 진출을 보장하지는 않습니다.\n하지만 어디서부터 시작해야 할지 모르는 선수들에게 실제로 움직일 수 있는 루트와 방법을 세부적으로 정리해둔 가이드입니다.\n막연한 도전에서, 방향이 잡힌 선수로 거듭나게 도와줍니다.',
  },
  {
    q: '기존 유튜브나 인터넷 정보랑 뭐가 다른가요?',
    a: '인터넷 정보는 많지만, 실제로 선수 입장에서 바로 적용하기는 어렵습니다.\n이 책은 무명 선수의 현실적인 해외 진출 과정에 맞춰 구성했습니다.\n연락 방법, 프로필 준비, 루트 탐색, 시행착오까지 실제로 필요한 내용만 정리했습니다.',
  },
  {
    q: '왜 이 책을 믿어도 되나요?',
    a: '이 책은 단순히 이론으로 만든 자료가 아닙니다.\n해외에서 직접 도전한 선수들의 경험과 실제 사례를 기반으로 구성했습니다.\nBROSPICK은 선수들의 다음 스텝을 돕기 위해 이 자료를 만들었습니다.\n과장보다 현실적인 방향 제시에 집중했습니다.',
  },
  {
    q: '가격이 비싼 이유가 뭔가요?',
    a: '지금도 많은 선수들이 에이전트 사기, 터무니없는 해외 테스트 비용, 미국 대학 에이전시 비용 등으로 수백만 원에서 수천만 원까지 지출하고 있습니다.\n이 책은 그런 어지러운 정보 속에서 실제 사례를 바탕으로 방향을 잡을 수 있도록 만든 자료입니다.\n단순한 정보값이 아니라, 잘못된 선택과 불필요한 시행착오 비용을 줄이기 위한 금액입니다.\n해외 진출을 진지하게 고민하는 선수라면, 먼저 알고 움직이는 것이 훨씬 중요합니다.\n운동부 한달 회비의 절반도 되지 않는 금액으로 많은 것들을 알게 될 것입니다.',
  },
];

export default function EbookFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div className={styles.faqList}>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className={styles.faqItem}>
            <button
              className={styles.faqTrigger}
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
            >
              <span className={styles.faqQuestion}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.75 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-1.75 3-2 3-5 0-2.21-1.79-4-4-4zm-1 9h2v2h-2v-2z"/>
                </svg>
                {item.q}
              </span>
              <svg
                className={`${styles.tocChevron} ${isOpen ? styles.tocChevronOpen : ''}`}
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
            <div className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}>
              <p style={{ whiteSpace: 'pre-line' }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
