export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { bootskinProductList, PRODUCT_SLUGS } from '@/lib/products';
import BeforeAfterSlider from '@/app/apparel/[slug]/BeforeAfterSlider';
import BootskinClient from './BootskinClient';
import BootskinPreview from './components/BootskinPreview';
import BootskinFaq from './components/BootskinFaq';
import {
  BOOTSKIN_APPLY_STEPS,
  BOOTSKIN_BEFORE_AFTER,
  BOOTSKIN_STATS,
} from './bootskin.config';
import styles from './bootskin-page.module.css';

export const metadata: Metadata = {
  title: '부츠스킨 | 브로스픽 BROSPICK',
  description:
    '축구화에 붙이는 번호·이니셜·국기·심볼 스티커. 붙이기 전에 내 축구화에 올려보고 고르세요.',
};

async function getPrices() {
  const { data } = await supabase
    .from('products')
    .select('id, name, price, original_price, coming_soon, sort_order');

  const map: Record<number, { name?: string; price: number; original_price: number | null; coming_soon: boolean; sort_order: number | null }> = {};
  for (const item of data || []) {
    map[item.id] = { name: item.name, price: item.price, original_price: item.original_price, coming_soon: item.coming_soon ?? false, sort_order: item.sort_order ?? null };
  }
  return map;
}

/**
 * 미리보기에서 바로 장바구니에 담을 수 있도록 부츠스킨 옵션의 재고 상태를 가져온다.
 * 키는 `${상품ID}-${옵션}` — 옵션 문자열은 product_sizes·주문 항목과 같은 값이어야
 * 어드민 표시와 결제 직전 재고 검증이 어긋나지 않는다.
 */
async function getBootskinStock() {
  const ids = bootskinProductList.map((product) => product.id);
  const { data } = await supabase
    .from('product_sizes')
    .select('product_id, size, status, stock')
    .in('product_id', ids);

  const map: Record<string, { status: string; stock: number }> = {};
  for (const row of data || []) {
    map[`${row.product_id}-${row.size}`] = { status: row.status ?? 'available', stock: row.stock ?? 0 };
  }
  return map;
}

export default async function BootskinPage() {
  const [prices, stock] = await Promise.all([getPrices(), getBootskinStock()]);

  if (process.env.NODE_ENV === 'development') {
    for (const product of bootskinProductList) {
      if (prices[product.id] !== undefined && product.comingSoon !== undefined) {
        prices[product.id].coming_soon = product.comingSoon;
      }
    }
  }

  return (
    <main className={styles.main}>
      {/* ===== 히어로 — 축구화 미리보기 ===== */}
      <section className={styles.hero}>
        <div className={styles.sectionInner}>
          <div className={styles.heroHeader}>
            <p className={styles.eyebrow}>BROSPICK BOOT SKIN</p>
            <h1 className={styles.heroTitle}>축구화에 나를 새기다</h1>
            <p className={styles.heroSubtitle}>
              번호와 이니셜부터 국기·심볼까지 골라 축구화에 직접 올려보세요.
              실제 부착 위치 그대로 보여드립니다.
            </p>
            <a href="#products" className={styles.heroSkip}>
              바로 상품 목록 보기 ↓
            </a>
          </div>

          <BootskinPreview prices={prices} stock={stock} />

          <div className={styles.statsBar}>
            {BOOTSKIN_STATS.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 상품 목록 ===== */}
      <section className={styles.products} id="products">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>COLLECTION</p>
            <h2 className={styles.sectionTitle}>부츠스킨 전체 보기</h2>
          </div>
          <BootskinClient initialPrices={prices} />
        </div>
      </section>

      {/* ===== 붙이기 전 / 후 ===== */}
      <section className={styles.beforeAfter}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>BEFORE / AFTER</p>
            <h2 className={styles.sectionTitle}>붙이는 순간 달라집니다</h2>
            <p className={styles.sectionLead}>
              손잡이를 좌우로 움직여 붙이기 전과 후를 비교해 보세요.
            </p>
          </div>
          <div className={styles.beforeAfterFrame}>
            <BeforeAfterSlider
              before={BOOTSKIN_BEFORE_AFTER.before}
              after={BOOTSKIN_BEFORE_AFTER.after}
              beforeLabel="BEFORE"
              afterLabel="AFTER"
              height={420}
            />
          </div>
        </div>
      </section>

      {/* ===== 부착 방법 ===== */}
      <section className={styles.apply}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>HOW TO APPLY</p>
            <h2 className={styles.sectionTitle}>붙이는 데 1분이면 충분합니다</h2>
            <p className={styles.sectionLead}>
              열프레스 같은 장비가 필요 없습니다. 집에서 세 단계로 끝납니다.
            </p>
          </div>
          <div className={styles.applyGrid}>
            {BOOTSKIN_APPLY_STEPS.map((item) => (
              <div key={item.step} className={styles.applyCard}>
                <p className={styles.applyStep}>{item.step}</p>
                <h3 className={styles.applyTitle}>{item.title}</h3>
                <p className={styles.applyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 커스텀 제작 ===== */}
      <section className={styles.custom}>
        <div className={styles.sectionInner}>
          <div className={styles.customBanner}>
            <div>
              <h2 className={styles.customTitle}>팀 로고나 나만의 디자인도 제작해 드립니다</h2>
              <p className={styles.customDesc}>
                카탈로그에 없는 디자인은 인쇄 판을 새로 떠서 제작합니다. 최소 10세트부터 주문할 수 있고,
                같은 디자인이라면 다음부터는 1세트씩 낱개로도 살 수 있습니다.
              </p>
            </div>
            <Link href={`/bootskin/${PRODUCT_SLUGS.BOOTSKIN_CUSTOM}`} className={styles.customCta}>
              커스텀 제작 문의 →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.faq}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
          </div>
          <BootskinFaq />
        </div>
      </section>
    </main>
  );
}
