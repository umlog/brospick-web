/**
 * 사람 이름 마스킹 — 국내 쇼핑몰 관행대로 가운데를 별표로 가린다.
 *
 * 화면에서만 자르면 안 된다. 공개 API 응답에 본명이 그대로 실려 나가면
 * 그 API 를 직접 부르는 쪽에는 아무것도 가려지지 않기 때문이다.
 * 서버가 내보내는 시점에 가린다.
 *
 *   홍길동   → 홍*동
 *   남궁민수 → 남**수
 *   김민     → 김*
 *   김       → 김
 */
export function maskPersonName(name: string): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return '';

  const chars = [...trimmed];
  if (chars.length === 1) return trimmed;
  if (chars.length === 2) return `${chars[0]}*`;

  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}
