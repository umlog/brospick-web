// =============================================================================
// OrderService - 주문 관련 비즈니스 로직
// app/api/orders/route.ts 와 app/api/orders/[id]/route.ts 에서 추출
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase';
import { inventoryService, type StockableItem } from './inventory.service';
import { notificationService } from './notification.service';
import { OrderStatus, isDelayStatus, isConfirmedStatus, STOCK_RESTORE_STATUSES } from '@/lib/domain/enums';
import { VALID_ORDER_STATUSES } from '@/lib/domain/constants';

interface CreateOrderItem {
  productId?: number;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  postalCode: string;
  address: string;
  addressDetail?: string;
  totalAmount: number;
  shippingFee: number;
  depositorName?: string;
  deliveryNote?: string;
  items: CreateOrderItem[];
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BP-${date}-${random}`;
}

export class OrderService {
  // 유효한 주문 상태인지 검증 (동적 발송지연 포함)
  isValidStatus(status: string): boolean {
    return (VALID_ORDER_STATUSES as readonly string[]).includes(status) || isDelayStatus(status);
  }

  // 주문 목록 조회
  async listOrders(filter?: { status?: string }) {
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items (*)')
      .order('created_at', { ascending: false });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`주문 조회에 실패했습니다: ${error.message}`);
    return { orders: data };
  }

  // 주문 생성
  async createOrder(payload: CreateOrderPayload, siteUrl: string) {
    const {
      customerName, customerPhone, customerEmail,
      postalCode, address, addressDetail,
      totalAmount, shippingFee, depositorName, deliveryNote, items,
    } = payload;

    // 필수 필드 검증
    if (!customerName || !customerPhone || !postalCode || !address || !items?.length) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }

    // 재고 확인
    const stockCheck = await inventoryService.checkStock(items as StockableItem[]);
    if (!stockCheck.ok) {
      throw Object.assign(new Error(stockCheck.message ?? '재고가 부족합니다.'), { status: 409 });
    }

    const orderNumber = generateOrderNumber();

    // 주문 생성
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        postal_code: postalCode,
        address,
        address_detail: addressDetail || null,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        depositor_name: depositorName || null,
        delivery_note: deliveryNote || null,
        payment_method: '무통장입금',
        status: OrderStatus.PENDING_PAYMENT,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(`주문 생성에 실패했습니다: ${orderError.message}`);
    }

    // 주문 상품 생성
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
      product_name: item.productName,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('Order items creation error:', itemsError);
    }

    // 재고 차감 (비동기 - 응답 지연시키지 않음)
    inventoryService.decrementStock(items as StockableItem[]).catch((err) =>
      console.error('Stock decrement failed:', err)
    );

    // 알림 발송 (비동기)
    notificationService.notifyOrderCreated({
      orderNumber: order.order_number,
      customerName,
      customerEmail: customerEmail ?? null,
      customerPhone,
      totalAmount: order.total_amount,
      shippingFee: order.shipping_fee,
      depositorName: depositorName || customerName,
      items: items.map((i) => ({
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      })),
      address,
      addressDetail: addressDetail ?? null,
      siteUrl,
    });

    return {
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      shippingFee: order.shipping_fee,
    };
  }

  // 주문 상태 변경
  async updateOrderStatus(
    orderId: string,
    status: string,
    options: { sendNotification: boolean; trackingNumber?: string },
    siteUrl: string
  ) {
    if (!this.isValidStatus(status)) {
      throw Object.assign(new Error('유효하지 않은 상태입니다.'), { status: 400 });
    }

    // 현재 주문 상태 조회 (재고 차감 판단용)
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status, order_items(product_id, size, quantity)')
      .eq('id', orderId)
      .single();

    const updateData: Record<string, unknown> = { status };
    if (options.trackingNumber && status === OrderStatus.SHIPPING) {
      updateData.tracking_number = options.trackingNumber;
    }
    if (status === OrderStatus.DELIVERED) {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
      throw new Error(`주문 상태 변경에 실패했습니다: ${error.message}`);
    }

    // 입금확인 또는 발송지연으로 전환 시 재고 차감 (아직 차감되지 않은 경우만)
    if (isConfirmedStatus(status) && currentOrder && !isConfirmedStatus(currentOrder.status)) {
      const items = Array.isArray(currentOrder.order_items) ? currentOrder.order_items : [];
      for (const item of items) {
        if (item.product_id) {
          await inventoryService.adjustStock(item.product_id, item.size, -item.quantity);
        }
      }
    }

    // 알림 발송
    if (options.sendNotification && data) {
      // 상품명 조회
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_name')
        .eq('order_id', data.id);
      const productName = orderItems?.map((i: { product_name: string }) => i.product_name).join(', ') || '';

      notificationService.notifyStatusChanged({
        orderNumber: data.order_number,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        productName,
        status,
        trackingNumber: data.tracking_number,
        siteUrl,
      });
    }

    return { order: data };
  }

  // 주문 삭제 (재고 복구 포함)
  async deleteOrder(orderId: string) {
    // 삭제 전 상태와 아이템 조회 (재고 복구 여부 판단)
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, order_items(product_id, size, quantity)')
      .eq('id', orderId)
      .single();

    const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('Order delete error:', error);
      throw new Error(`주문 삭제에 실패했습니다: ${error.message}`);
    }

    // 입금확인 이후 상태였다면 재고 복구
    const restoreStatuses = STOCK_RESTORE_STATUSES as readonly string[];
    if (order && (restoreStatuses.includes(order.status) || isDelayStatus(order.status))) {
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      await inventoryService.restoreStock(
        items.filter((i: { product_id: number | null }) => i.product_id).map((i: { product_id: number; size: string; quantity: number }) => ({
          product_id: i.product_id,
          size: i.size,
          quantity: i.quantity,
        }))
      );
    }

    return { success: true };
  }

  // 입금 안내 메일 발송
  async sendPaymentReminder(orderId: string, siteUrl: string) {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, customer_name, customer_email, total_amount')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw Object.assign(new Error('주문을 찾을 수 없습니다.'), { status: 404 });
    }

    if (!order.customer_email) {
      throw Object.assign(new Error('고객 이메일이 없습니다.'), { status: 400 });
    }

    await notificationService.notifyPaymentReminder({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      totalAmount: order.total_amount,
      siteUrl,
    });

    return { success: true };
  }
}

export const orderService = new OrderService();
