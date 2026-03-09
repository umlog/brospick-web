import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  if (orderNumber) {
    // 임시 주문 삭제 (카카오페이 결제중 상태만)
    await supabaseAdmin
      .from('orders')
      .delete()
      .eq('order_number', orderNumber)
      .eq('status', '카카오페이 결제중');
  }

  return NextResponse.redirect(`${siteUrl}/checkout`);
}
