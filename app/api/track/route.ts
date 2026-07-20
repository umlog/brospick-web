import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 자체 유입경로·퍼널 이벤트 수집 (어드민 대시보드용)
// 공개 엔드포인트 — 방문자 브라우저가 직접 호출 (GA4/픽셀과 무관하게 항상 수집)

const ALLOWED_TYPES = new Set(['visit', 'view_item', 'add_to_cart', 'begin_checkout']);
const MAX_FIELD_LENGTH = 100;

export async function POST(request: NextRequest) {
  let body: { type?: string; source?: string; path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.type || !ALLOWED_TYPES.has(body.type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('analytics_events').insert({
    type: body.type,
    source: body.source?.slice(0, MAX_FIELD_LENGTH) ?? null,
    path: body.path?.slice(0, MAX_FIELD_LENGTH) ?? null,
  });

  if (error) {
    // 수집 실패는 방문자 경험에 영향 없어야 함 — 로그만
    console.error('[track] insert 실패:', error.message);
  }

  return NextResponse.json({ ok: true });
}
