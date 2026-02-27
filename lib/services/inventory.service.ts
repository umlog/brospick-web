// =============================================================================
// InventoryService - 재고 관련 비즈니스 로직
// 기존에 orders/route.ts, orders/[id]/route.ts, returns/[id]/route.ts 에
// 동일한 코드가 3번 복제되어 있던 adjustStock 함수를 단일화
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase';
import { SizeStatus } from '@/lib/domain/enums';

export interface StockableItem {
  productId?: number | null;
  product_id?: number | null;
  size: string;
  quantity: number;
  price?: number;
  productName?: string;
  product_name?: string;
}

export class InventoryService {
  // 재고 조정: delta < 0이면 차감, delta > 0이면 증가
  // 기존 3곳에 복제된 adjustStock() 함수 통합
  async adjustStock(productId: number, size: string, delta: number): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('product_sizes')
      .select('stock, status')
      .match({ product_id: productId, size })
      .single();

    if (error || !data) return; // 해당 row 없으면 skip

    const newStock = Math.max(0, data.stock + delta);
    const updateData: Record<string, unknown> = {
      stock: newStock,
      updated_at: new Date().toISOString(),
    };

    // stock 0 → sold_out (available인 경우만)
    if (newStock === 0 && data.status === SizeStatus.AVAILABLE) {
      updateData.status = SizeStatus.SOLD_OUT;
    }
    // stock 복구 → available (sold_out이었던 경우만, delayed는 건드리지 않음)
    if (newStock > 0 && data.status === SizeStatus.SOLD_OUT) {
      updateData.status = SizeStatus.AVAILABLE;
    }

    await supabaseAdmin
      .from('product_sizes')
      .update(updateData)
      .match({ product_id: productId, size });
  }

  // 주문 가능 여부 확인 (주문 생성 전 재고 체크)
  async checkStock(items: StockableItem[]): Promise<{ ok: boolean; message?: string }> {
    const itemsWithProduct = items.filter((item) => (item.productId ?? item.product_id) != null);
    if (itemsWithProduct.length === 0) return { ok: true };

    for (const item of itemsWithProduct) {
      const productId = item.productId ?? item.product_id;
      const productName = item.productName ?? item.product_name ?? '상품';

      const { data, error } = await supabaseAdmin
        .from('product_sizes')
        .select('status, stock')
        .eq('product_id', productId!)
        .eq('size', item.size)
        .maybeSingle();

      if (error) {
        console.error('Stock check DB error:', error);
        continue; // DB 오류 시 해당 항목 스킵 (관리자 수동 처리)
      }

      if (!data) continue; // product_sizes에 등록 안 된 상품 → 재고 관리 대상 아님

      if (data.status === SizeStatus.SOLD_OUT || data.stock <= 0) {
        return {
          ok: false,
          message: `${productName} ${item.size} 사이즈가 품절되었습니다.`,
        };
      }

      if (item.quantity > data.stock) {
        return {
          ok: false,
          message: `${productName} ${item.size} 사이즈의 재고가 부족합니다. (남은 재고: ${data.stock}개)`,
        };
      }
    }

    return { ok: true };
  }

  // 재고 차감 (주문 완료 후 비동기 호출)
  async decrementStock(items: StockableItem[]): Promise<void> {
    const itemsWithProduct = items.filter((item) => (item.productId ?? item.product_id) != null);
    if (itemsWithProduct.length === 0) return;

    await Promise.all(
      itemsWithProduct.map(async (item) => {
        const productId = (item.productId ?? item.product_id)!;
        try {
          // RPC 함수가 있으면 원자적으로 처리 (race condition 방지)
          const { error: rpcError } = await supabaseAdmin.rpc('decrement_stock', {
            p_product_id: productId,
            p_size: item.size,
            p_quantity: item.quantity,
          });

          if (rpcError) {
            // RPC 없는 경우: select → update fallback
            await this.adjustStock(productId, item.size, -item.quantity);
          } else {
            // RPC 성공 후에도 stock=0이면 status 업데이트 (RPC가 status를 바꾸지 않는 경우 대비)
            const { data: afterRpc } = await supabaseAdmin
              .from('product_sizes')
              .select('stock, status')
              .eq('product_id', productId)
              .eq('size', item.size)
              .single();

            if (afterRpc && afterRpc.stock === 0 && afterRpc.status === SizeStatus.AVAILABLE) {
              await supabaseAdmin
                .from('product_sizes')
                .update({ status: SizeStatus.SOLD_OUT })
                .eq('product_id', productId)
                .eq('size', item.size);
            }
          }
        } catch (err) {
          console.error('Stock decrement error:', err);
          // 재고 차감 실패는 주문 자체를 실패시키지 않음
        }
      })
    );
  }

  // 재고 복구 (주문 삭제 또는 반품 처리 시)
  async restoreStock(items: StockableItem[]): Promise<void> {
    for (const item of items) {
      const productId = item.productId ?? item.product_id;
      if (productId) {
        await this.adjustStock(productId, item.size, item.quantity);
      }
    }
  }
}

export const inventoryService = new InventoryService();
