// =============================================================================
// 익명 공개 API 남용 방지용 레이트 리미터 (Supabase 공유 카운터)
//
// 예전엔 인메모리 Map 이었는데, Netlify 함수는 인스턴스가 여러 개로 갈리고
// 수시로 재시작돼서 카운트가 계속 0으로 돌아갔다. 카운트를 DB(rate_limits 테이블,
// hit_rate_limit 함수)에 두어 모든 인스턴스가 같은 숫자를 본다.
//
// 분산 공격(IP 수천 개)을 막는 장치는 아니다. 한 클라이언트가 전화번호·주문번호·
// 비밀번호를 기계적으로 돌려보는 것을 끊는 게 목적이다.
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase';

export interface RateLimitRule {
  /** 창 안에서 허용할 최대 요청 수 */
  max: number;
  /** 창 길이(ms) */
  windowMs: number;
}

/**
 * 클라이언트 IP.
 *
 * x-forwarded-for 는 요청하는 쪽이 임의 값을 넣어 보낼 수 있어, 그 값을 바꿔가며
 * 한도를 우회할 수 있다. Netlify 가 직접 채우는 x-nf-client-connection-ip 를
 * 먼저 본다. 로컬 개발처럼 그 헤더가 없을 때만 x-forwarded-for 로 떨어진다.
 */
export function clientIp(request: { headers: { get(name: string): string | null } }): string {
  const netlifyIp = request.headers.get('x-nf-client-connection-ip')?.trim();
  if (netlifyIp) return netlifyIp;

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * 호출할 때마다 카운트가 1 올라간다. 한도를 넘었으면 true.
 * @param key 버킷 구분자 — 라우트 이름과 IP를 함께 넣어 라우트별로 따로 센다
 *
 * DB 호출이 실패하면 막지 않고 통과시킨다. 이 라우트들은 어차피 같은 DB를 써야
 * 동작하므로, 카운터 장애로 정상 손님까지 막는 쪽이 더 손해다. 실패는 로그로 남긴다.
 */
export async function isRateLimited(key: string, { max, windowMs }: RateLimitRule): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('hit_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_seconds: Math.ceil(windowMs / 1000),
  });

  if (error) {
    console.error('[rate-limit] 카운터 조회 실패 — 통과시킴:', { key, message: error.message });
    return false;
  }

  return data === true;
}
