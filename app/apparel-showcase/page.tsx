'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './showcase.module.css';

export default function ApparelShowcase() {
  const [currentImage, setCurrentImage] = useState(0);

  // 여기에 실제 이미지 경로를 추가하세요
  const images = [
    '/apparel/brospick-sportswear-1-removebg-preview.png',
    '/apparel/brospick-sportswear-2-removebg-preview.png',
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.imageContainer}>
          <div className={styles.slider}>
            {images.map((img, index) => (
              <div
                key={index}
                className={`${styles.slide} ${index === currentImage ? styles.active : ''
                  }`}
              >
                <Image
                  src={img}
                  alt={`Apparel ${index + 1}`}
                  fill
                  className={styles.image}
                  style={{ objectFit: 'cover' }}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={prevImage}
            aria-label="이전 이미지"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={nextImage}
            aria-label="다음 이미지"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className={styles.dots}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentImage ? styles.activeDot : ''
                  }`}
                onClick={() => setCurrentImage(index)}
                aria-label={`이미지 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.textContainer}>
            <h1 className={styles.title}>BROSPICK COLLECTION</h1>
            <p className={styles.subtitle}>Coming Soon</p>

            <div className={styles.description}>
              <p>
                브로스픽의 첫 번째 컬렉션을 준비하고 있습니다.
              </p>
              <p>
                우리의 가치를 담은 특별한 의류로 곧 찾아뵙겠습니다.
              </p>
            </div>

            {/* <div className={styles.info}>
              <div className={styles.infoItem}>
                <h3>Philosophy</h3>
                <p>선수를 생각</p>
              </div>
              <div className={styles.infoItem}>
                <h3>Quality</h3>
                <p>프리미엄 소재</p>
              </div>
              <div className={styles.infoItem}>
                <h3>Vision</h3>
                <p>시간이 지나도 가치 있는 옷</p>
              </div>
            </div> */}

            <div className={styles.comingSoon}>
              {/* <p className={styles.notice}>현재 판매 준비 중입니다</p> */}
              <p className={styles.contact}>
                문의: <a href="mailto:team.brospick@gmail.com">team.brospick@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
