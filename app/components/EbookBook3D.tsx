import { EBOOK } from '@/app/ebook/ebook.config';
import styles from './ebook-book-3d.module.css';

interface Props {
  scale?: number;
}

export default function EbookBook3D({ scale = 1 }: Props) {
  return (
    <div
      className={styles.bookScene}
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    >
      <div className={styles.book}>
        <div className={styles.bookFront}>
          <div className={styles.bookFrontContent}>
            <div>
              <p className={styles.bookBrand}>BROSPICK</p>
              <div className={styles.bookDivider} />
            </div>
            <p className={styles.bookTitleText}>{EBOOK.title}</p>
            <p className={styles.bookLabel}>E-BOOK · {EBOOK.year}</p>
          </div>
          <div className={styles.bookShine} />
          <div className={styles.bookAccentBar} />
        </div>
        <div className={styles.bookSpineFace} />
        <div className={styles.bookPageBlock} />
        <div className={styles.bookTopFace} />
      </div>
      <div className={styles.bookGroundShadow} />
    </div>
  );
}
