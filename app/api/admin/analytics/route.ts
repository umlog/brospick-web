import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, checkAdminSession } from '@/lib/errors';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

// GET /api/admin/analytics?days=7 — 유입경로별 방문 + 전환 퍼널 집계 (관리자 전용)
export async function GET(request: NextRequest) {
  if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
    return apiError('권한이 없습니다.', 401);
  }

  const daysParam = parseInt(request.nextUrl.searchParams.get('days') ?? '', 10);
  const days = Number.isNaN(daysParam) ? DEFAULT_DAYS : Math.min(Math.max(daysParam, 1), MAX_DAYS);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [summaryRes, ordersRes] = await Promise.all([
    supabaseAdmin.rpc('analytics_summary', { days }),
    supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since.toISOString())
      .is('deleted_at', null),
  ]);

  if (summaryRes.error) {
    console.error('[admin/analytics] 집계 실패:', summaryRes.error.message);
    return apiError('분석 데이터 조회에 실패했습니다.', 500);
  }

  return NextResponse.json({
    days,
    sources: summaryRes.data?.sources ?? [],
    funnel: summaryRes.data?.funnel ?? {},
    orders: ordersRes.count ?? 0,
  });
}
