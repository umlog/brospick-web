import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 사이즈 가용성 조회 (공개)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_sizes')
      .select('product_id, size, status')
      .order('product_id')
      .order('size');

    if (error) {
      console.error('Product sizes fetch error:', error);
      return NextResponse.json(
        { error: '사이즈 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sizes: data });
  } catch (error) {
    console.error('Product sizes API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사이즈 상태 변경 (관리자)
export async function PATCH(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
    }

    const { productId, size, status } = await request.json();

    const validStatuses = ['available', 'sold_out', 'delayed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('product_sizes')
      .update({ status, updated_at: new Date().toISOString() })
      .match({ product_id: productId, size });

    if (error) {
      console.error('Product size update error:', error);
      return NextResponse.json(
        { error: '상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product size update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
