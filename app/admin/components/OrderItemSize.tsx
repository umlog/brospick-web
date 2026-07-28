import styles from '../admin.module.css';

// 색상 옵션이 붙은 사이즈("8 — Black", "L — White")를 포장 시 헷갈리지 않도록
// 색상 부분만 눈에 띄는 색상칩으로 분리해 표시한다.
// 색상이 없는 사이즈(ONE SIZE, CROSS 등)는 기존처럼 괄호 텍스트로만 표시.
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
}

export function OrderItemSize({ size }: OrderItemSizeProps) {
  const segments = size.split(SIZE_SEPARATOR);
  const lastSegment = segments[segments.length - 1];
  const chipClass = COLOR_CHIP_CLASS[lastSegment];

  if (!chipClass) {
    return <span className={styles.detailItemOption}>({size})</span>;
  }

  const base = segments.slice(0, -1).join(SIZE_SEPARATOR);
  return (
    <span className={styles.detailItemOption}>
      {base && <span>({base})</span>}
      <span className={`${styles.colorChip} ${chipClass}`}>{lastSegment.toUpperCase()}</span>
    </span>
  );
}
