import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminPassword, withErrorHandler } from '@/lib/errors';
import { returnService } from '@/lib/services';

// 교환/반품 신청 (고객)
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    try {
      const result = await returnService.createReturnRequest(body, siteUrl);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '서버 오류가 발생했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 교환/반품 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;

    try {
      const result = await returnService.listReturnRequests({ status });
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '교환/반품 목록 조회에 실패했습니다.', 500);
    }
  });
}
