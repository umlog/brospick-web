import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { orderService } from '@/lib/services';

// 영구 삭제 (관리자) - 휴지통에서만 호출
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    try {
      const result = await orderService.permanentDeleteOrder(params.id);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '영구 삭제에 실패했습니다.', 500);
    }
  });
}
