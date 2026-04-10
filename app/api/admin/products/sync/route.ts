import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { productList } from '@/lib/products';

// lib/products.ts 기준으로 DB에 없는 상품 목록 조회
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data, error } = await supabaseAdmin.from('products').select('id');
    if (error) return apiError(`조회 실패: ${error.message}`, 500);

    // DB 조회 결과가 비어있는데 products.ts에 상품이 많으면 조회 이상 → 배너 숨김
    if ((data ?? []).length === 0 && productList.length > 3) {
      return NextResponse.json({ unsynced: [] });
    }

    const dbIds = new Set((data ?? []).map((p) => p.id));
    const unsynced = productList
      .filter((p) => !dbIds.has(p.id))
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, category: p.category }));

    return NextResponse.json({ unsynced });
  });
}

// 미등록 상품을 DB에 추가 (price=0, coming_soon=true 기본값)
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!checkAdminSession(request.cookies.get('admin_session')?.value)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data: existing, error: fetchError } = await supabaseAdmin.from('products').select('id');
    if (fetchError) return apiError(`조회 실패: ${fetchError.message}`, 500);

    const dbIds = new Set((existing ?? []).map((p) => p.id));
    const toInsert = productList
      .filter((p) => !dbIds.has(p.id))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        price: 0,
        original_price: null,
        coming_soon: true,
      }));

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    const { error } = await supabaseAdmin.from('products').insert(toInsert);
    if (error) return apiError(`등록 실패: ${error.message}`, 500);

    return NextResponse.json({ inserted: toInsert.length });
  });
}
