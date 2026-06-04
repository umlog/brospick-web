import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { reviewService } from '@/lib/services/review.service';

// 주문번호+전화번호로 리뷰 작성 가능한 상품 조회
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const { orderNumber, phone } = await request.json();

    if (!orderNumber || !phone) {
      return apiError('주문번호와 전화번호를 입력해주세요.', 400);
    }

    try {
      const result = await reviewService.getReviewableItems(orderNumber, phone);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}
