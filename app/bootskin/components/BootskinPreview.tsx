'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { trackAddToCart } from '../../../lib/analytics';
import {
  BOOTSKIN_BEFORE_AFTER,
  PREVIEW_DEFAULT,
  PREVIEW_SLOTS,
  getPreviewGroups,
  type PreviewGroup,
  type PreviewOption,
  type PreviewSlot,
  type StickerFit,
  type StickerMm,
} from '../bootskin.config';
import styles from '../bootskin-page.module.css';

/** 축구화 사진 비율 — 세로 비율(%)을 cqw로 환산할 때 쓴다 */
const BOOT_WIDTH = 1448;
const BOOT_HEIGHT = 1086;
const HEIGHT_TO_CQW = BOOT_HEIGHT / BOOT_WIDTH;

/** 촬영본과 같은 배열 순서 (국기 → 이니셜 → 번호) */
const SLOT_ORDER: Record<PreviewSlot, string[]> = {
  front: ['nation', 'initial', 'number', 'family'],
  heel: ['faith', 'symbol'],
};

/** 확대 보기 배율과 기준점 — 갑피 스티커 자리를 중심으로 당긴다 */
const ZOOM_SCALE = 2.1;
const ZOOM_ORIGIN = `${PREVIEW_SLOTS.front.left * 100}% ${PREVIEW_SLOTS.front.top * 100}%`;

interface PriceRow {
  name?: string;
  price: number;
  coming_soon: boolean;
}

interface StockRow {
  status: string;
  stock: number;
}

interface Props {
  prices: Record<number, PriceRow>;
  /** `${상품ID}-${옵션}` → 재고 상태 */
  stock: Record<string, StockRow>;
}

/** 화이트 스티커는 밝은 칩 위에서 보이지 않는다 */
function isLightSticker(value: string): boolean {
  return value.toLowerCase().includes('white');
}

/** 나란히 붙인 글자 사이 간격. 촬영본의 J와 Y가 0.3mm쯤 떨어져 있었다 */
const LETTER_GAP_MM = 0.5;

/** mm를 축구화 사진 위의 길이(cqw)로 바꾼다 */
function toCqw(mm: number, slot: PreviewSlot): string {
  return `${(mm * PREVIEW_SLOTS[slot].mmScale * 100 * HEIGHT_TO_CQW).toFixed(3)}cqw`;
}

/**
 * 실측 mm를 화면 크기로 바꾼다. fit이 무엇을 기준으로 삼을지 정한다.
 *
 * `height` — 세로만 고정하고 가로는 아트웍 비율대로 흐르게 둔다.
 * 글자는 높이가 같아야 나란히 붙였을 때 들쭉날쭉하지 않다.
 * `box` — 가로·세로 상자를 잡고 아트웍을 그 안에 넣는다(object-fit: contain).
 * 가로로 긴 문구가 축구화 밖으로 삐져나가지 않는다.
 */
function stickerBox(
  mm: StickerMm,
  slot: PreviewSlot,
  fit: StickerFit,
): { width?: string; height: string } {
  const [widthMm, heightMm] = mm;
  if (fit === 'height') {
    return { height: toCqw(heightMm, slot) };
  }
  return { width: toCqw(widthMm, slot), height: toCqw(heightMm, slot) };
}

/**
 * 장바구니·재고·주문 항목이 공유하는 옵션 문자열.
 * 색상이 있는 그룹은 `7 — Black` 형식이어야 어드민 색상칩과 재고 검증이 맞는다.
 */
function toOptionValue(group: PreviewGroup, value: string, tone: 'Black' | 'White'): string {
  return group.toned ? `${value} — ${tone}` : value;
}

export default function BootskinPreview({ prices, stock }: Props) {
  const [tone, setTone] = useState<'Black' | 'White'>('Black');
  const [activeTab, setActiveTab] = useState('number');
  const [selected, setSelected] = useState<Record<string, string[]>>(PREVIEW_DEFAULT);
  const [zoomed, setZoomed] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const groups = getPreviewGroups(tone);
  const activeGroup = groups.find((group) => group.key === activeTab) ?? groups[0];

  const soldOutOf = (group: PreviewGroup, value: string): boolean => {
    const row = stock[`${group.productId}-${toOptionValue(group, value, tone)}`];
    return !!row && (row.status === 'sold_out' || row.stock <= 0);
  };

  const picksOf = (group: PreviewGroup): string[] => selected[group.key] ?? [];

  /**
   * 고른 걸 다시 누르면 빠지고, 새로 누르면 뒤에 붙는다(누른 순서 = 붙는 순서).
   * 정원이 찼으면 가장 먼저 고른 걸 밀어낸다 — 눌러도 아무 일이 없는 것보다 낫다.
   */
  const toggleOption = (group: PreviewGroup, value: string) => {
    if (soldOutOf(group, value)) return;
    setAdded(false);
    setSelected((prev) => {
      const picks = prev[group.key] ?? [];
      if (picks.includes(value)) {
        return { ...prev, [group.key]: picks.filter((pick) => pick !== value) };
      }
      return { ...prev, [group.key]: [...picks, value].slice(-group.maxPicks) };
    });
  };

  const findSelectedOptions = (group: PreviewGroup) =>
    picksOf(group)
      .map((value) => group.options.find((option) => option.value === value))
      .filter((option): option is PreviewOption => !!option);

  /** 장바구니 한 줄 = 스티커 한 장. 이니셜 3글자면 세 줄이 된다 */
  const chosen = groups.flatMap((group) =>
    picksOf(group).map((value) => ({ group, value })),
  );

  const totalPrice = chosen.reduce(
    (sum, { group }) => sum + (prices[group.productId]?.price ?? 0),
    0,
  );

  const handleAddAll = () => {
    for (const { group, value } of chosen) {
      const priceRow = prices[group.productId];
      if (!priceRow || priceRow.coming_soon) continue;
      addToCart({
        id: group.productId,
        name: priceRow.name ?? group.productName,
        price: priceRow.price,
        size: toOptionValue(group, value, tone),
        image: group.thumbnail,
        quantity: 1,
      });
    }
    trackAddToCart(chosen[0].group.productId, '부츠스킨 조합', totalPrice, chosen.length);
    setAdded(true);
  };

  const renderSlot = (slot: PreviewSlot) => {
    const order = SLOT_ORDER[slot];
    const slotGroups = groups
      .filter((group) => group.slot === slot)
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    const anchor = PREVIEW_SLOTS[slot];

    return (
      <div
        className={styles.previewSlot}
        style={{
          left: `${anchor.left * 100}%`,
          top: `${anchor.top * 100}%`,
          gap: `${anchor.gap * 100}cqw`,
        }}
      >
        {slotGroups.map((group) => {
          const options = findSelectedOptions(group);
          if (options.length === 0) return null;
          // 흰 축구화 위의 화이트 스티커는 윤곽이 없으면 보이지 않는다
          const isLight = group.toned && tone === 'White';
          return (
            // 같은 그룹(예: 이니셜 3글자)은 한 덩어리로 묶어 나란히 붙인다
            <span
              key={group.key}
              className={styles.previewStickerRun}
              style={{ gap: toCqw(LETTER_GAP_MM, slot) }}
            >
              {options.map((option) => {
                const { plate } = option;
                // 판이 있으면 그림자·등장 효과는 판이 맡는다.
                // 인쇄된 국기는 평평하므로 태극과 괘가 깃면 위에 그림자를 지면 안 된다.
                const needsOutline =
                  !plate && (isLight || isLightSticker(option.value));
                // 생성물(public/_bootskin)은 next/image 최적화 대상이 아니라 그대로 쓴다
                // eslint-disable-next-line @next/next/no-img-element
                const sticker = (
                  <img
                    key={option.value}
                    src={option.overlay}
                    alt=""
                    className={[
                      styles.previewSticker,
                      needsOutline ? styles.previewStickerLight : '',
                      plate ? styles.previewStickerOnPlate : '',
                    ].join(' ')}
                    style={stickerBox(option.mm, slot, group.fit)}
                  />
                );
                if (!plate) return sticker;
                // 태극기는 흰 깃면이 디자인의 일부라 판을 깔고 그 위에 얹는다
                return (
                  <span
                    key={option.value}
                    className={styles.previewStickerPlate}
                    style={{
                      width: toCqw(plate.mm[0], slot),
                      height: toCqw(plate.mm[1], slot),
                      borderRadius: plate.round ? '50%' : undefined,
                    }}
                  >
                    {sticker}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.previewLayout}>
      <div className={styles.previewStageWrap}>
        <div className={styles.previewStage}>
          <div
            className={styles.previewZoomLayer}
            style={zoomed ? { transform: `scale(${ZOOM_SCALE})`, transformOrigin: ZOOM_ORIGIN } : undefined}
          >
            <Image
              src={BOOTSKIN_BEFORE_AFTER.before}
              alt="부츠스킨을 붙일 축구화"
              width={BOOT_WIDTH}
              height={BOOT_HEIGHT}
              sizes="(max-width: 900px) 100vw, 720px"
              className={styles.previewBoot}
              priority
            />
            {renderSlot('front')}
            {renderSlot('heel')}
          </div>

          <button
            type="button"
            className={styles.previewZoomBtn}
            onClick={() => setZoomed((prev) => !prev)}
            aria-pressed={zoomed}
          >
            {zoomed ? '전체 보기' : '부착 부위 확대'}
          </button>
        </div>
      </div>

      <div className={styles.previewPanel}>
        <div className={styles.previewTabs} role="tablist">
          {groups.map((group) => (
            <button
              key={group.key}
              role="tab"
              aria-selected={group.key === activeTab}
              className={`${styles.previewTab} ${group.key === activeTab ? styles.previewTabActive : ''}`}
              onClick={() => setActiveTab(group.key)}
            >
              {group.label}
              <span className={styles.previewTabPrice}>
                ₩{(prices[group.productId]?.price ?? 0).toLocaleString()}
              </span>
              {selected[group.key] && <span className={styles.previewTabDot} aria-hidden="true" />}
            </button>
          ))}
        </div>

        {activeGroup.toned && (
          <div className={styles.previewToneRow}>
            {(['Black', 'White'] as const).map((option) => (
              <button
                key={option}
                className={`${styles.previewTone} ${tone === option ? styles.previewToneActive : ''}`}
                onClick={() => { setTone(option); setAdded(false); }}
              >
                <span
                  className={styles.previewToneDot}
                  style={{ background: option === 'Black' ? '#1a1a1a' : '#f0f0f0' }}
                  aria-hidden="true"
                />
                {option === 'Black' ? '블랙' : '화이트'}
              </button>
            ))}
          </div>
        )}

        {activeGroup.maxPicks > 1 && (
          <p className={styles.previewPickHint}>
            누른 순서대로 나란히 붙습니다 · <strong>최대 {activeGroup.maxPicks}개</strong> 중{' '}
            {picksOf(activeGroup).length}개 선택
          </p>
        )}

        <div className={styles.previewOptions}>
          {activeGroup.options.map((option) => {
            const isSelected = picksOf(activeGroup).includes(option.value);
            const isSoldOut = soldOutOf(activeGroup, option.value);
            // 화이트 스티커는 밝은 칩 위에서 보이지 않으므로 칩을 어둡게 깐다
            const needsDarkChip =
              isLightSticker(option.value) || (activeGroup.toned && tone === 'White');
            return (
              <button
                key={option.value}
                title={isSoldOut ? `${option.value} (품절)` : option.value}
                aria-label={option.value}
                aria-pressed={isSelected}
                disabled={isSoldOut}
                className={[
                  styles.previewOption,
                  isSelected ? styles.previewOptionActive : '',
                  needsDarkChip ? styles.previewOptionDark : '',
                  isSoldOut ? styles.previewOptionSoldOut : '',
                ].join(' ')}
                onClick={() => toggleOption(activeGroup, option.value)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={option.overlay} alt="" className={styles.previewOptionImage} />
              </button>
            );
          })}
        </div>

        <div className={styles.previewSummary}>
          {chosen.length === 0 ? (
            <p className={styles.previewEmpty}>스티커를 골라 축구화에 올려보세요.</p>
          ) : (
            <>
              <ul className={styles.previewChosenList}>
                {chosen.map(({ group, value }) => (
                  <li key={`${group.key}-${value}`} className={styles.previewChosenItem}>
                    <span className={styles.previewChosenLabel}>{group.label}</span>
                    <span className={styles.previewChosenValue}>
                      {toOptionValue(group, value, tone)}
                    </span>
                    <span className={styles.previewChosenPrice}>
                      ₩{(prices[group.productId]?.price ?? 0).toLocaleString()}
                    </span>
                    <Link
                      href={`/bootskin/${group.slug}?option=${encodeURIComponent(toOptionValue(group, value, tone))}`}
                      className={styles.previewChosenLink}
                    >
                      자세히
                    </Link>
                  </li>
                ))}
              </ul>

              <div className={styles.previewTotalRow}>
                <span>합계 {chosen.length}장</span>
                <strong>₩{totalPrice.toLocaleString()}</strong>
              </div>

              <div className={styles.previewActions}>
                <button type="button" className={styles.previewAddBtn} onClick={handleAddAll}>
                  {added ? '장바구니에 담았습니다' : '이 조합 장바구니에 담기'}
                </button>
                {added && (
                  <Link href="/cart" className={styles.previewCartLink}>
                    장바구니 보기 →
                  </Link>
                )}
              </div>

              <button className={styles.previewReset} onClick={() => { setSelected({}); setAdded(false); }}>
                전부 지우기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
