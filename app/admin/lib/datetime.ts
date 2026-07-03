// DB의 UTC ISO 문자열 ↔ 어드민 폼(로컬 시간) 변환.
// datetime-local input은 값을 로컬 시간으로 해석하므로 UTC 문자열을 그대로 넣으면 9시간 어긋난다.

/** UTC ISO → datetime-local input 값 (로컬 시간 기준 "YYYY-MM-DDTHH:mm") */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** UTC ISO → 로컬 날짜 문자열 "YYYY-MM-DD" (목록 표시용) */
export function toLocalDateString(iso: string): string {
  return toDatetimeLocalValue(iso).slice(0, 10);
}

/** 오늘 날짜(로컬 기준) "YYYY-MM-DD" — new Date().toISOString()은 UTC라 KST 새벽에 하루 어긋난다 */
export function todayLocal(): string {
  return toLocalDateString(new Date().toISOString());
}
