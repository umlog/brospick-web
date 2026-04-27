import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';
    const result = await orderService.cancelOrder(body, siteUrl);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    const status = ([400, 404] as number[]).includes(e.status ?? 0) ? e.status! : 500;
    return NextResponse.json({ error: e.message || '취소 처리에 실패했습니다.' }, { status });
  }
}
