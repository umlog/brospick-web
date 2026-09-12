import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { reviewService } from '@/lib/services/review.service';

// 전화번호만으로 열리는 조회라 번호를 돌려보는 열거를 막아야 한다
const LOOKUP_LIMIT = { max: 12, windowMs: 10 * 60 * 1000 };

// 내 리뷰 조회
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (isRateLimited(`reviews:my:${clientIp(request)}`, LOOKUP_LIMIT)) {
      return apiError('조회 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.', 429);
    }

    const { phone } = await request.json();
    if (!phone) return apiError('전화번호를 입력해주세요.', 400);

    try {
      const result = await reviewService.getMyReviews(phone);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 리뷰 수정
export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const { phone, reviewId, rating, content, images, height, usual_size } = await request.json();

    if (!phone || !reviewId || !rating || !content?.trim()) {
      return apiError('필수 정보가 누락되었습니다.', 400);
    }
    if (rating < 1 || rating > 5) return apiError('별점은 1~5 사이여야 합니다.', 400);

    try {
      await reviewService.updateReview(phone, reviewId, { rating, content, images, height: height ?? null, usual_size: usual_size ?? null });
      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 403, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 리뷰 삭제
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const { phone, reviewId } = await request.json();

    if (!phone || !reviewId) return apiError('필수 정보가 누락되었습니다.', 400);

    try {
      await reviewService.deleteReview(phone, reviewId);
      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 403, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}
