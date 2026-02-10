import Link from 'next/link';
import Image from 'next/image';
import styles from './sportswear.module.css';

export default function Sportswear() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Sportswear</h2>

        <div className={styles.card}>
          <Link href="/apparel/1" className={styles.imageContainer}>
            <Image
              src="/apparel/bp-detailpoint.JPG"
              alt="Half-Zip Training Top"
              fill
              className={styles.image}
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.badge}>NOW AVAILABLE</div>
          </Link>

          <div className={styles.info}>
            <p className={styles.label}>BROSPICK COLLECTION</p>
            <h3 className={styles.productName}>Half-Zip Training Top</h3>
            <p className={styles.description}>
              선수와 팬이 함께 입는 브로스픽의 첫 번째 컬렉션.
              편안한 착용감과 스타일을 겸비한 하프집 트레이닝 탑.
            </p>
            <div className={styles.priceRow}>
              <span className={styles.price}>₩28,900</span>
              <span className={styles.originalPrice}>₩69,000</span>
            </div>
            <Link href="/apparel/1" className={styles.shopLink}>
              구매하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
