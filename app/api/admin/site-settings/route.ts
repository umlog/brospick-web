import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized, apiError, withErrorHandler } from '@/lib/errors';

export async function GET() {
  return withErrorHandler(async () => {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value');

    if (error) return apiError(error.message, 500);

    const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    return NextResponse.json(settings);
  });
}

export async function PATCH(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

    const body = await request.json() as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) return apiError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  });
}
