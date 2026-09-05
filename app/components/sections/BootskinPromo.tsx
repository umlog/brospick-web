import Link from 'next/link';
import BeforeAfterSlider from '@/app/apparel/[slug]/BeforeAfterSlider';
import ProductImage from '../ProductImage';
import { bootskinProductList } from '@/lib/products';
import { BOOTSKIN_BEFORE_AFTER, BOOTSKIN_SAMPLES } from '@/app/bootskin/bootskin.config';
import styles from './bootskin-promo.module.css';

interface Props {
  /** 홈에서 이미 조회한 가격 맵 — 최저가 표기에 사용 */
  prices: Record<number, { price: number; coming_soon: boolean }>;
}

export default function BootskinPromo({ prices }: Props) {
  const onSalePrices = bootskinProductList
    .map((product) => prices[product.id])
    .filter((row): row is { price: number; coming_soon: boolean } => !!row && !row.coming_soon)
    .map((row) => row.price);
  const lowestPrice = onSalePrices.length > 0 ? Math.min(...onSalePrices) : null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>BROSPICK BOOT SKIN</p>
            <h2 className={styles.title}>부츠스킨</h2>
          </div>
          <Link href="/bootskin" className={styles.viewAll}>
            전체 보기 <span>→</span>
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.visualCol}>
            <BeforeAfterSlider
              before={BOOTSKIN_BEFORE_AFTER.before}
              after={BOOTSKIN_BEFORE_AFTER.after}
              beforeLabel="BEFORE"
              afterLabel="AFTER"
              height={360}
            />
            <p className={styles.visualHint}>슬라이더를 드래그해 보세요</p>
          </div>

          <div className={styles.content}>
            <p className={styles.badge}>대표 상품</p>
            <h3 className={styles.cardTitle}>축구화에 나를 새기다</h3>
            <p className={styles.desc}>
              등번호, 이니셜, 국기, 가족의 이름까지. 붙이는 순간 남의 축구화가 내 축구화가 됩니다.
            </p>

            <ul className={styles.sampleRow}>
              {BOOTSKIN_SAMPLES.map((sample) => (
                <li key={sample.image} className={styles.sample}>
                  <div className={styles.sampleThumb}>
                    <ProductImage src={sample.image} alt={sample.label} sizes="72px" />
                  </div>
                  <span className={styles.sampleLabel}>{sample.label}</span>
                </li>
              ))}
            </ul>

            {lowestPrice !== null && (
              <div className={styles.priceRow}>
                <span className={styles.price}>₩{lowestPrice.toLocaleString()}</span>
                <span className={styles.priceFrom}>부터</span>
              </div>
            )}

            <Link href="/bootskin" className={styles.cta}>
              부츠스킨 보러가기 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
