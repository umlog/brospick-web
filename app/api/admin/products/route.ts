import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';

// 상품 목록 조회
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('id');

    if (error) return apiError(`상품 조회 실패: ${error.message}`, 500);
    return NextResponse.json({ products: data });
  });
}

// 상품 이름/가격 수정
export async function PATCH(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const { id, name, price, original_price } = body as {
      id: number;
      name?: string;
      price?: number;
      original_price?: number | null;
    };

    if (!id) return apiError('상품 ID가 필요합니다.', 400);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (original_price !== undefined) updates.original_price = original_price;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return apiError(`상품 수정 실패: ${error.message}`, 500);
    return NextResponse.json({ product: data });
  });
}
