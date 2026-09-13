import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { reviewService } from '@/lib/services/review.service';

// 제출도 이름·전화번호 대조를 거치므로, 대입 시도를 끊기 위해 횟수를 센다
const SUBMIT_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

// 리뷰 제출
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (await isRateLimited(`reviews:submit:${clientIp(request)}`, SUBMIT_LIMIT)) {
      return apiError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 429);
    }

    const body = await request.json();

    try {
      const result = await reviewService.submitReview(body);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404, 409] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 상품별 리뷰 조회 (?productId=X)
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const productIdParam = searchParams.get('productId');

    if (!productIdParam) {
      return apiError('productId가 필요합니다.', 400);
    }

    const productId = parseInt(productIdParam, 10);
    if (isNaN(productId)) {
      return apiError('유효하지 않은 productId입니다.', 400);
    }

    try {
      const result = await reviewService.getProductReviews(productId);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=300' },
      });
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '리뷰 조회에 실패했습니다.', 500);
    }
  });
}
