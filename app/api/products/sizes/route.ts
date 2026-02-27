import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiError, checkAdminPassword } from '@/lib/errors';

// 사이즈 가용성 및 재고 조회 (공개)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_sizes')
      .select('product_id, size, status, stock')
      .order('product_id')
      .order('size');

    if (error) {
      console.error('Product sizes fetch error:', error);
      return apiError('사이즈 정보 조회에 실패했습니다.', 500);
    }

    // stock=0인데 status가 available인 행 자동 정정
    const toFix = data?.filter((s) => s.stock === 0 && s.status === 'available') ?? [];
    if (toFix.length > 0) {
      await supabaseAdmin
        .from('product_sizes')
        .update({ status: 'sold_out' })
        .eq('status', 'available')
        .eq('stock', 0);
    }

    const corrected = (data ?? []).map((s) => ({
      ...s,
      status: s.stock === 0 && s.status === 'available' ? 'sold_out' : s.status,
    }));

    return NextResponse.json({ sizes: corrected });
  } catch (error) {
    console.error('Product sizes API error:', error);
    return apiError('서버 오류가 발생했습니다.', 500);
  }
}

// 사이즈 상태/재고 변경 (관리자)
export async function PATCH(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!checkAdminPassword(password)) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const { productId, size, status, stock } = body;

    if (!productId || !size) {
      return apiError('상품 ID와 사이즈를 입력해주세요.', 400);
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // 상태 변경
    if (status !== undefined) {
      const validStatuses = ['available', 'sold_out', 'delayed'];
      if (!validStatuses.includes(status)) {
        return apiError('유효하지 않은 상태입니다.', 400);
      }
      updateData.status = status;
    }

    // 재고 수량 직접 설정
    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return apiError('재고는 0 이상의 정수여야 합니다.', 400);
      }
      updateData.stock = stockNum;

      // stock 변경 시 status 자동 업데이트 (status를 동시에 직접 지정하지 않은 경우에만)
      if (status === undefined) {
        const { data: current } = await supabaseAdmin
          .from('product_sizes')
          .select('status')
          .match({ product_id: productId, size })
          .single();

        if (current) {
          if (stockNum === 0 && current.status === 'available') {
            updateData.status = 'sold_out';
          } else if (stockNum > 0 && current.status === 'sold_out') {
            updateData.status = 'available';
          }
          // delayed는 자동으로 바꾸지 않음
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('product_sizes')
      .update(updateData)
      .match({ product_id: productId, size })
      .select('product_id, size, status, stock')
      .single();

    if (error) {
      console.error('Product size update error:', error);
      return apiError('변경에 실패했습니다.', 500);
    }

    return NextResponse.json({ success: true, size: data });
  } catch (error) {
    console.error('Product size update API error:', error);
    return apiError('서버 오류가 발생했습니다.', 500);
  }
}
