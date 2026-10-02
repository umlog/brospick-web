import { getImplicitColor } from '@/lib/products';
import styles from '../admin.module.css';

// 색상 옵션이 붙은 사이즈("8 — Black", "L — White")를 포장 시 헷갈리지 않도록
// 색상 부분만 눈에 띄는 색상칩으로 분리해 표시한다.
// 색상이 없는 사이즈(ONE SIZE, GOD 등)는 기존처럼 괄호 텍스트로만 표시.
// 값에 색이 안 적혀 있어도 화이트 짝이 있는 옵션(CROSS 등)은 기본색 칩을 붙인다 — 어드민에서만.
const COLOR_CHIP_CLASS: Record<string, string> = {
  Black: styles.colorChipBlack,
  White: styles.colorChipWhite,
  Gray: styles.colorChipGray,
  'Sky Blue': styles.colorChipSky,
};

// 상품 사이즈 문자열에서 색상을 분리하는 구분자 (예: "8 — Black")
const SIZE_SEPARATOR = ' — ';

interface OrderItemSizeProps {
  size: string;
  /** 있으면 값에 색이 안 적힌 옵션의 기본색도 찾아 칩으로 붙인다 */
  productId?: number;
}

export function OrderItemSize({ size, productId }: OrderItemSizeProps) {
  const segments = size.split(SIZE_SEPARATOR);
  const lastSegment = segments[segments.length - 1];
  const hasColorSegment = COLOR_CHIP_CLASS[lastSegment] !== undefined;
  const color = hasColorSegment
    ? lastSegment
    : productId !== undefined ? getImplicitColor(productId, size) : undefined;
  const chipClass = color ? COLOR_CHIP_CLASS[color] : undefined;

  if (!color || !chipClass) {
    return <span className={styles.detailItemOption}>({size})</span>;
  }

  const base = hasColorSegment ? segments.slice(0, -1).join(SIZE_SEPARATOR) : size;
  return (
    <span className={styles.detailItemOption}>
      {base && <span>({base})</span>}
      <span className={`${styles.colorChip} ${chipClass}`}>{color.toUpperCase()}</span>
    </span>
  );
}
