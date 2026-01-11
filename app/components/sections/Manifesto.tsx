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
    content: '선수를 위한 새로운 시스템\n브로스픽이 탄생한 이유는 단순합니다.\n한국 축구 선수들이 마주하는 현실적인 벽을 누군가는 부셔야 한다고 생각했기 때문입니다.',
  },
  {
    id: 2,
    title: '문제를 직시하다',
    content: '국내 시스템 속에서는 선수의 꿈이 제한됩니다.\n기회는 부족하고, 비용은 과하고, 정보는 불투명합니다.\n에이전시는 형식적인 테스트와 과도한 수수료로 선수를 짓누르고,\n선수들은 자신의 가능성을 증명할 기회를 얻지 못한 채 무릎을 꿉니다.\n우리는 이것이 옳지 않다고 판단했습니다.',
  },
  {
    id: 3,
    title: '다음 주인공은 당신입니다',
    content: '이미 많은 선수들이 브로스픽을 통해\n호주, 미국, 유럽의 무대로 나아갔습니다.\n더 이상 국내 시스템의 한계 속에서 꿈을 포기하지 마세요.\n당신의 이야기를 세계에 보여주세요.',
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
