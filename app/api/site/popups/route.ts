import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('site_popups')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return NextResponse.json(null);
  return NextResponse.json(data?.[0] ?? null, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  });
}
