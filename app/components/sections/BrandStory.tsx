'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './brand-story.module.css';
import { EBOOK } from '@/app/ebook/ebook.config';

const SLIDES = ['sportswear', 'ebook'] as const;
type Slide = typeof SLIDES[number];

export default function BrandStory() {
  const [active, setActive] = useState<Slide>('sportswear');
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (slide: Slide) => {
    if (slide === active || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(slide);
      setAnimating(false);
    }, 300);
  };

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const next = active === 'sportswear' ? 'ebook' : 'sportswear';
      goTo(next);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return (
    <section className={styles.section}>
      <Link
        href={active === 'sportswear' ? '/apparel' : '/ebook'}
        className={`${styles.inner} ${styles.innerLink} ${animating ? styles.fadeOut : styles.fadeIn}`}
      >
        {active === 'sportswear' ? (
          <>
            <div className={styles.imageCol}>
              <div className={styles.imageWrap}>
                <Image
                  src="\brandstroy\sportswear-brandstory-detail.png"
                  alt="브로스픽 스포츠웨어"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className={styles.textCol}>
              <p className={styles.eyebrow}>BROSPICK SPORTSWEAR</p>
              <h2 className={styles.heading}>
                브로스픽은 선수의 움직임에<br />맞게 설계합니다.
              </h2>
              <p className={styles.body}>
                트레이닝의 모든 순간을 함께하는 의류. 경기장 밖에서도 선수다운 스타일을 유지할 수 있도록, 기능성과 디자인을 동시에 담았습니다.
              </p>
              <p className={styles.body}>
                브로스픽 스포츠웨어는 단순한 운동복이 아닙니다. 선수가 자신을 표현하는 방식입니다.
              </p>
              <span className={styles.cta}>
                more <span>→</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.imageCol}>
              <div className={styles.ebookCover}>
                <span className={styles.ebookCoverEyebrow}>BROSPICK</span>
                <span className={styles.ebookCoverDivider} />
                <p className={styles.ebookCoverTitle}>The Overseas<br />Football<br />Playbook</p>
                <span className={styles.ebookCoverYear}>{EBOOK.year}</span>
              </div>
            </div>
            <div className={styles.textCol}>
              <p className={styles.eyebrow}>{EBOOK.eyebrow}</p>
              <h2 className={styles.heading}>
                해외 진출을 꿈꾼다면,<br />이 한 권으로 시작하세요.
              </h2>
              <p className={styles.body}>
                자기 평가부터 오퍼·계약까지. 브로스픽이 직접 발로 뛰며 쌓은 실전 경험을 한 권에 담았습니다.
              </p>
              <ul className={styles.ebookBenefits}>
                {EBOOK.benefits.map((b) => (
                  <li key={b.title} className={styles.ebookBenefit}>
                    <span className={styles.ebookBenefitDot} />
                    {b.title}
                  </li>
                ))}
              </ul>
              <span className={styles.cta}>
                more <span>→</span>
              </span>
            </div>
          </>
        )}
      </Link>

      {/* 도트 네비게이션 */}
      <div className={styles.dots}>
        {SLIDES.map((slide) => (
          <button
            key={slide}
            className={`${styles.dot} ${active === slide ? styles.dotActive : ''}`}
            onClick={(e) => { e.preventDefault(); goTo(slide); }}
            aria-label={slide === 'sportswear' ? '스포츠웨어' : '이북'}
          />
        ))}
      </div>
    </section>
  );
}
