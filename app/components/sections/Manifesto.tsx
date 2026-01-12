'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './manifesto.module.css';
import ScrollReveal from '../animations/ScrollReveal';
import symbolImg from '../../styles/symbol.png';

const slides = [
  {
    id: 1,
    title: '브로스픽의 철학',
    content: '브로스픽은 한국 축구 선수들이 마주한\n현실적인 한계를 깨기 위해 탄생했습니다.\n선수를 위한 새로운 시스템이 필요하다는 믿음에서 시작됐습니다.',
  },
  {
    id: 2,
    title: '문제를 직시하다',
    content: '국내 선수들은 불공정한 구조 속에서\n기회를 얻지 못하고 잠재력을 잃고 있습니다.\n우리는 이런 현실이 잘못되었다고 판단했습니다.',
  },
  {
    id: 3,
    title: '다음 주인공은 당신입니다',
    content: '더 이상 국내 시스템의 한계 속에서\n꿈을 포기하지 마세요.\n브로스픽을 통해 당신의 이야기를 세계에 보여주세요.',
  },
];

export default function Manifesto() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5초마다 자동 슬라이드

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="manifesto" className={styles.manifesto}>
      <div className={styles.container}>
        <ScrollReveal direction="up">
          <h2 className={styles.sectionTitle}>BROSPICK</h2>
        </ScrollReveal>

        <div className={styles.content}>
          <div className={styles.leftSection}>
            <div className={styles.slideCard}>
              <div className={styles.symbolWrapper}>
                <Image
                  src={symbolImg}
                  alt=""
                  className={styles.symbolBg}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className={styles.slideContent_wrapper}>
                <h3 className={styles.slideTitle}>{slides[currentSlide].title}</h3>
                <p className={styles.slideContent}>{slides[currentSlide].content}</p>
              </div>
            </div>

            <div className={styles.controls}>
              <button
                className={styles.navButton}
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                ‹
              </button>

              <div className={styles.indicators}>
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                className={styles.navButton}
                onClick={nextSlide}
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.imageWrapper}>
              <Image
                src="/placeholder-manifesto.jpg"
                alt="Manifesto"
                fill
                style={{ objectFit: 'cover', borderRadius: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
