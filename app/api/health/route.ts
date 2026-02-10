import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Supabase 헬스체크 - 주기적으로 호출하여 무료 플랜 비활성 방지
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      orders: count,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
