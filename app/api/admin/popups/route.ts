import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminAuthorized, apiError } from '@/lib/errors';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function guard(request: NextRequest) {
  if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);
  return null;
}

export async function GET(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('site_popups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from('site_popups')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const { id, ...updates } = await request.json();
  const { data, error } = await supabase
    .from('site_popups')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const { id } = await request.json();
  const { error } = await supabase.from('site_popups').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
