import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { reviewService } from '@/lib/services/review.service';

// 리뷰 제출
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
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
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '리뷰 조회에 실패했습니다.', 500);
    }
  });
}
