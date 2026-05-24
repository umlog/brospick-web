import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'degraded', error: 'DB unavailable', timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: 'degraded', error: 'Health check failed', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
