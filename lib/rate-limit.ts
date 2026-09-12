// =============================================================================
// 익명 공개 API 남용 방지용 인메모리 레이트 리미터
//
// 서버 인스턴스마다 카운트가 따로 잡히고 재시작하면 초기화된다.
// 분산 공격을 막는 장치가 아니라, 한 클라이언트가 전화번호를 기계적으로
// 돌려보며 개인정보를 긁어가는 것을 끊는 게 목적이다.
// =============================================================================

export interface RateLimitRule {
  /** 창 안에서 허용할 최대 요청 수 */
  max: number;
  /** 창 길이(ms) */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// 만료된 칸이 쌓여 메모리를 먹지 않도록, 일정 크기를 넘으면 한 번 쓸어낸다
const SWEEP_THRESHOLD = 5000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/** 프록시를 거쳐 들어온 요청에서 클라이언트 IP를 뽑는다 */
export function clientIp(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * 호출할 때마다 카운트가 1 올라간다. 한도를 넘었으면 true.
 * @param key 버킷 구분자 — 라우트 이름과 IP를 함께 넣어 라우트별로 따로 센다
 */
export function isRateLimited(key: string, { max, windowMs }: RateLimitRule): boolean {
  const now = Date.now();

  if (buckets.size > SWEEP_THRESHOLD) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count++;
  return bucket.count > max;
}
