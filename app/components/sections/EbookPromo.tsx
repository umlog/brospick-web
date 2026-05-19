import Link from 'next/link';
import { EBOOK } from '@/app/ebook/ebook.config';
import EbookBook3D from '@/app/components/EbookBook3D';
import styles from './ebook-promo.module.css';

export default function EbookPromo() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>BROSPICK E-BOOK</p>
            <h2 className={styles.title}>해외 축구 진출 가이드</h2>
          </div>
          <Link href="/ebook" className={styles.viewAll}>
            자세히 보기 <span>→</span>
          </Link>
        </div>

        <Link href="/ebook" className={styles.card}>
          <div className={styles.bookCol}>
            <div className={styles.bookScaleWrapper}>
              <EbookBook3D />
            </div>
          </div>
          <div className={styles.content}>
            <p className={styles.badge}>{EBOOK.eyebrow}</p>
            <h3 className={styles.bookTitle}>{EBOOK.title}</h3>
            <p className={styles.desc}>{EBOOK.subtitle.split('\n')[0]}</p>
            <div className={styles.priceRow}>
              <span className={styles.originalPrice}>
                {EBOOK.originalPrice.toLocaleString()}원
              </span>
              <span className={styles.price}>
                {EBOOK.price.toLocaleString()}원
              </span>
              <span className={styles.priceBadge}>얼리버드</span>
            </div>
            <span className={styles.cta}>지금 구매하기 →</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
