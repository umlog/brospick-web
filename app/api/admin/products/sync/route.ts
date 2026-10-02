import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, isAdminAuthorized, withErrorHandler } from '@/lib/errors';
import { productList, products as staticProducts, getStockKeys } from '@/lib/products';
import { revalidateProducts } from '@/lib/cache';

interface MissingSize {
  product_id: number;
  size: string;
}

/**
 * lib/products.ts에는 있는데 product_sizes에 행이 없는 옵션.
 *
 * 행이 없는 옵션은 상세에서 구매 가능으로 보이고 주문 시 재고 검사도 건너뛴다(inventory.service).
 * 부츠스킨 스티커처럼 코드 쪽에서 옵션이 늘어나면 여기서 잡아 품절 행으로 먼저 만든다.
 */
async function findMissingSizes(): Promise<MissingSize[]> {
  const { data, error } = await supabaseAdmin.from('product_sizes').select('product_id, size');
  if (error) throw new Error(`사이즈 조회 실패: ${error.message}`);

  const existing = new Set((data ?? []).map((row) => JSON.stringify([row.product_id, row.size])));
  return Object.values(staticProducts).flatMap((product) =>
    getStockKeys(product)
      .filter((size) => !existing.has(JSON.stringify([product.id, size])))
      .map((size) => ({ product_id: product.id, size })),
  );
}

// lib/products.ts 기준으로 DB에 없는 상품·옵션 조회
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data, error } = await supabaseAdmin.from('products').select('id');
    if (error) return apiError(`조회 실패: ${error.message}`, 500);

    // DB 조회 결과가 비어있는데 products.ts에 상품이 많으면 조회 이상 → 배너 숨김
    if ((data ?? []).length === 0 && productList.length > 3) {
      return NextResponse.json({ unsynced: [], missingSizes: [] });
    }

    const dbIds = new Set((data ?? []).map((p) => p.id));
    const unsynced = productList
      .filter((p) => !dbIds.has(p.id))
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, category: p.category }));

    return NextResponse.json({ unsynced, missingSizes: await findMissingSizes() });
  });
}

// 미등록 상품(price=0, coming_soon=true)과 재고 행이 없는 옵션(stock=0, sold_out)을 DB에 추가
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAdminAuthorized(request)) {
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

    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin.from('products').insert(toInsert);
      if (error) return apiError(`등록 실패: ${error.message}`, 500);
    }

    // 상품 행을 먼저 넣어야 새 상품의 옵션도 같은 조회에 잡힌다
    const sizesToInsert = (await findMissingSizes()).map((row) => ({ ...row, status: 'sold_out', stock: 0 }));
    if (sizesToInsert.length > 0) {
      const { error: sizesError } = await supabaseAdmin.from('product_sizes').insert(sizesToInsert);
      if (sizesError) return apiError(`사이즈 등록 실패: ${sizesError.message}`, 500);
    }

    // 새 옵션이 품절 행으로 바뀌었으니 상세·목록 캐시도 갱신한다
    if (toInsert.length > 0 || sizesToInsert.length > 0) {
      revalidateProducts([...toInsert.map((p) => p.id), ...sizesToInsert.map((row) => row.product_id)]);
    }

    return NextResponse.json({ inserted: toInsert.length, insertedSizes: sizesToInsert.length });
  });
}
