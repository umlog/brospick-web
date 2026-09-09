import { SYMBOL_MONOGRAM, SYMBOL_ORBIT, SYMBOL_SHIFT, SYMBOL_VIEWBOX } from './symbol-paths';

interface BrandSymbolProps {
  /** CSS 길이. 정사각형이라 높이와 같다. */
  size?: string;
  className?: string;
  /** 로고 옆에 텍스트가 없을 때만 라벨을 붙인다 */
  title?: string;
}

/**
 * 브로스픽 심볼. 인라인 SVG라 currentColor로 테마를 따라가고,
 * 별도 네트워크 요청 없이 어떤 배율에서도 선명하다.
 */
export function BrandSymbol({ size = '44px', className, title }: BrandSymbolProps) {
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform={SYMBOL_SHIFT}>
        <path d={SYMBOL_MONOGRAM} />
        {SYMBOL_ORBIT.map((d) => (
          <path key={d.length + d.slice(0, 12)} d={d} />
        ))}
      </g>
    </svg>
  );
}
