import { NextRequest, NextResponse } from 'next/server';
import { apiError, withErrorHandler } from '@/lib/errors';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { reviewService } from '@/lib/services/review.service';

// 로그인 없이 이름·전화번호만으로 열리는 창구라 번호를 돌려보는 열거를 막아야 한다
const LOOKUP_LIMIT = { max: 12, windowMs: 10 * 60 * 1000 };
// 수정·삭제는 공개 리뷰 id 를 들고 이름·번호를 대입해볼 수 있어 따로 센다
const WRITE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

function tooManyRequests() {
  return apiError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 429);
}

// 내 리뷰 조회
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (await isRateLimited(`reviews:my:${clientIp(request)}`, LOOKUP_LIMIT)) {
      return tooManyRequests();
    }

    const { name, phone } = await request.json();
    if (!name?.trim()) return apiError('이름을 입력해주세요.', 400);
    if (!phone?.trim()) return apiError('전화번호를 입력해주세요.', 400);

    try {
      const result = await reviewService.getMyReviews(name, phone);
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
    if (await isRateLimited(`reviews:my:write:${clientIp(request)}`, WRITE_LIMIT)) {
      return tooManyRequests();
    }

    const { name, phone, reviewId, rating, content, images, height, usual_size } = await request.json();

    if (!name?.trim() || !phone || !reviewId || !rating || !content?.trim()) {
      return apiError('필수 정보가 누락되었습니다.', 400);
    }

    try {
      await reviewService.updateReview(name, phone, reviewId, { rating, content, images, height: height ?? null, usual_size: usual_size ?? null });
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
    if (await isRateLimited(`reviews:my:write:${clientIp(request)}`, WRITE_LIMIT)) {
      return tooManyRequests();
    }

    const { name, phone, reviewId } = await request.json();

    if (!name?.trim() || !phone || !reviewId) return apiError('필수 정보가 누락되었습니다.', 400);

    try {
      await reviewService.deleteReview(name, phone, reviewId);
      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 403, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}
