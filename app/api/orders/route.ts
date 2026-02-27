import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminPassword, withErrorHandler } from '@/lib/errors';
import { orderService } from '@/lib/services';

// 주문 생성
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    try {
      const result = await orderService.createOrder(body, siteUrl);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = (e.status === 400 || e.status === 409) ? e.status : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 409 | 500);
    }
  });
}

// 주문 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;

    try {
      const result = await orderService.listOrders({ status });
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '주문 조회에 실패했습니다.', 500);
    }
  });
}
