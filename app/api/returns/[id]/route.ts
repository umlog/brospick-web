import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminPassword, withErrorHandler } from '@/lib/errors';
import { returnService } from '@/lib/services';

// 교환/반품 상태 변경 (관리자)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    try {
      const result = await returnService.updateReturnStatus(params.id, body, siteUrl);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
      return apiError(e.message || '상태 변경에 실패했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 교환/반품 삭제 (관리자)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    try {
      const result = await returnService.deleteReturnRequest(params.id);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '삭제에 실패했습니다.', 500);
    }
  });
}
