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
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');
  if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('order_notes')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const { order_id, note } = await request.json();
  if (!order_id || !note?.trim()) {
    return NextResponse.json({ error: 'order_id, note required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('order_notes')
    .insert({ order_id, note: note.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const err = guard(request); if (err) return err;
  const supabase = getServiceClient();
  const { id } = await request.json();
  const { error } = await supabase.from('order_notes').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
