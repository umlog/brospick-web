'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/products';

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
 * 기존 raw <img onError> 패턴을 state 기반으로 옮긴 것.
 */
export default function ProductImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  priority = false,
}: Props) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => {
        if (imgSrc !== PRODUCT_FALLBACK_IMAGE) setImgSrc(PRODUCT_FALLBACK_IMAGE);
      }}
    />
  );
}
