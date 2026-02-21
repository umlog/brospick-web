import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// POST /api/visits - 방문 수 증가 (세션당 1회)
export async function POST() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // increment_visit RPC 함수가 있으면 사용, 없으면 직접 처리
  const { error: rpcError } = await supabaseAdmin.rpc('increment_visit', { visit_date: today });

  if (rpcError) {
    // RPC 없는 경우: 직접 select → update/insert
    const { data: existing } = await supabaseAdmin
      .from('page_visits')
      .select('count')
      .eq('date', today)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('page_visits')
        .update({ count: existing.count + 1 })
        .eq('date', today);
    } else {
      await supabaseAdmin
        .from('page_visits')
        .insert({ date: today, count: 1 });
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/visits - 방문 수 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fromDate = sevenDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('page_visits')
    .select('date, count')
    .gte('date', fromDate)
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todayRow = data?.find((r) => r.date === today);
  const todayCount = todayRow?.count ?? 0;

  return NextResponse.json({ today: todayCount, recent: data ?? [] });
}
