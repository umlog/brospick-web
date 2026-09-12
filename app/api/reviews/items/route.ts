import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { reviewService } from '@/lib/services/review.service';

// 이름+전화번호로 리뷰 작성 가능한 주문 목록 조회.
// 로그인 없이 남의 개인정보를 조회할 수 있는 창구라, 번호를 기계적으로 돌려보는
// 열거를 막기 위해 IP당 횟수를 제한한다.
const LOOKUP_LIMIT = { max: 12, windowMs: 10 * 60 * 1000 };

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (isRateLimited(`reviews:items:${clientIp(request)}`, LOOKUP_LIMIT)) {
      return apiError('조회 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.', 429);
    }

    const { name, phone } = await request.json();

    if (!name?.trim()) return apiError('이름을 입력해주세요.', 400);
    if (!phone?.trim()) return apiError('전화번호를 입력해주세요.', 400);

    try {
      const result = await reviewService.getReviewableOrders(name, phone);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}
