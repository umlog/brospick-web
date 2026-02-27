import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminPassword, withErrorHandler } from '@/lib/errors';
import { orderService } from '@/lib/services';

// 주문 삭제 (관리자)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    try {
      const result = await orderService.deleteOrder(params.id);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || '주문 삭제에 실패했습니다.', 500);
    }
  });
}

// 입금 안내 메일 발송 (관리자)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    try {
      const result = await orderService.sendPaymentReminder(params.id, siteUrl);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = (e.status === 404 || e.status === 400) ? e.status : 500;
      return apiError(e.message || '메일 발송에 실패했습니다.', status as 400 | 404 | 500);
    }
  });
}

// 주문 상태 변경 (관리자)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!checkAdminPassword(request.headers.get('x-admin-password'))) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const { status, sendNotification, trackingNumber } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    try {
      const result = await orderService.updateOrderStatus(
        params.id,
        status,
        { sendNotification: !!sendNotification, trackingNumber },
        siteUrl
      );
      return NextResponse.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const httpStatus = e.status === 400 ? 400 : 500;
      return apiError(e.message || '주문 상태 변경에 실패했습니다.', httpStatus as 400 | 500);
    }
  });
}
