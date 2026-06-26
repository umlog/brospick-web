'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/products';
import styles from './product-image.module.css';

interface Props {
  src: string;
  alt: string;
  /** 부모 래퍼는 position: relative + 고정 크기(aspect-ratio 등)를 가져야 한다. */
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * next/image(fill) 래퍼. 로드 실패 시 PRODUCT_FALLBACK_IMAGE로 대체한다.
 * 로딩 중에는 shimmer 스켈레톤을 덮어 첫 표시를 매끄럽게 한다.
 */
export default function ProductImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  priority = false,
}: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 캐시 히트 시 onLoad가 누락될 수 있어, 마운트 시점에 이미 완료됐는지 확인한다.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <>
      <div className={`${styles.skeleton} ${loaded ? styles.skeletonHidden : ''}`} aria-hidden="true" />
      <Image
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={`${className ?? ''} ${styles.image} ${loaded ? styles.imageLoaded : ''}`.trim()}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imgSrc !== PRODUCT_FALLBACK_IMAGE) setImgSrc(PRODUCT_FALLBACK_IMAGE);
        }}
      />
    </>
  );
}
