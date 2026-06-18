// =============================================================================
// OrderService - 주문 관련 비즈니스 로직
// app/api/orders/route.ts 와 app/api/orders/[id]/route.ts 에서 추출
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase';
import { inventoryService, type StockableItem } from './inventory.service';
import { notificationService } from './notification.service';
import { OrderStatus, isDelayStatus, isConfirmedStatus, STOCK_RESTORE_STATUSES } from '@/lib/domain/enums';
import { VALID_ORDER_STATUSES, CANCELLABLE_STATUSES } from '@/lib/domain/constants';
import { getKakaoPayConfig } from '@/lib/kakao-pay';

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
  privacyConsent?: boolean;
  thirdPartyConsent?: boolean;
  marketingConsent?: boolean;
  paymentMethod?: string;
  couponCode?: string;
  items: CreateOrderItem[];
}

interface CreateOrderOptions {
  skipStockDecrement?: boolean;
  skipNotification?: boolean;
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

  // 주문 목록 조회 (휴지통 제외)
  async listOrders(filter?: { status?: string }) {
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items (*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`주문 조회에 실패했습니다: ${error.message}`);
    return { orders: data };
  }

  // 휴지통 목록 조회
  async listTrashedOrders() {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items (*)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) throw new Error(`휴지통 조회에 실패했습니다: ${error.message}`);
    return { orders: data };
  }

  // 주문 생성
  async createOrder(payload: CreateOrderPayload, siteUrl: string, options: CreateOrderOptions = {}) {
    const {
      customerName, customerPhone, customerEmail,
      postalCode, address, addressDetail,
      totalAmount, shippingFee, depositorName, deliveryNote,
      privacyConsent, thirdPartyConsent, marketingConsent,
      paymentMethod, couponCode, items,
    } = payload;

    // 필수 필드 검증
    if (!customerName || !customerPhone || !postalCode || !address || !items?.length) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }

    // 서버에서 상품 가격/이름 조회 (클라이언트 전송 값 무시)
    const productIds = items.map((i) => i.productId).filter((id): id is number => id != null);
    const { data: dbProducts, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (productError) throw new Error(`상품 정보 조회에 실패했습니다: ${productError.message}`);

    const productMap = new Map((dbProducts ?? []).map((p) => [p.id, p]));

    const verifiedItems = items.map((item) => {
      const dbProduct = item.productId != null ? productMap.get(item.productId) : null;
      return {
        ...item,
        productName: dbProduct?.name ?? item.productName,
        price: dbProduct?.price ?? item.price,
      };
    });

    const itemsSubtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 쿠폰 서버 검증
    let couponDiscount = 0;
    let validatedCouponId: number | null = null;
    let validatedCouponUsedCount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (!coupon) {
        throw Object.assign(new Error('유효하지 않은 쿠폰 코드입니다.'), { status: 400 });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw Object.assign(new Error('만료된 쿠폰입니다.'), { status: 400 });
      }
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        throw Object.assign(new Error('사용 한도가 초과된 쿠폰입니다.'), { status: 400 });
      }
      if (itemsSubtotal < (coupon.min_order_amount ?? 0)) {
        throw Object.assign(new Error(`최소 주문 금액 ${coupon.min_order_amount.toLocaleString()}원 이상 주문 시 사용 가능합니다.`), { status: 400 });
      }

      if (coupon.discount_type === 'amount') {
        couponDiscount = coupon.discount_value;
      } else {
        couponDiscount = Math.floor(itemsSubtotal * coupon.discount_value / 100);
        if (coupon.max_discount_amount) {
          couponDiscount = Math.min(couponDiscount, coupon.max_discount_amount);
        }
      }
      couponDiscount = Math.min(couponDiscount, itemsSubtotal);
      validatedCouponId = coupon.id;
      validatedCouponUsedCount = coupon.used_count;
    }

    const verifiedTotal = itemsSubtotal + shippingFee - couponDiscount;
    if (verifiedTotal !== totalAmount) {
      throw Object.assign(
        new Error(`결제 금액이 올바르지 않습니다. (expected: ${verifiedTotal}, received: ${totalAmount})`),
        { status: 400 }
      );
    }

    // 재고 확인
    const stockCheck = await inventoryService.checkStock(verifiedItems as StockableItem[]);
    if (!stockCheck.ok) {
      throw Object.assign(new Error(stockCheck.message ?? '재고가 부족합니다.'), { status: 409 });
    }

    // 주문 생성 (번호 충돌 시 최대 3회 재시도)
    let order: { id: string; order_number: string; total_amount: number; shipping_fee: number } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: generateOrderNumber(),
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          postal_code: postalCode,
          address,
          address_detail: addressDetail || null,
          total_amount: totalAmount,
          shipping_fee: shippingFee,
          coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
          discount_amount: couponDiscount,
          depositor_name: depositorName || null,
          delivery_note: deliveryNote || null,
          privacy_consent: privacyConsent ?? true,
          third_party_consent: thirdPartyConsent ?? true,
          marketing_consent: marketingConsent ?? false,
          payment_method: paymentMethod ?? '무통장입금',
          status: OrderStatus.PENDING_PAYMENT,
        })
        .select()
        .single();
      if (!error) { order = data; break; }
      if (error.code !== '23505') {
        console.error('Order creation error:', error);
        throw new Error(`주문 생성에 실패했습니다: ${error.message}`);
      }
    }
    if (!order) throw new Error('주문 번호 생성에 실패했습니다. 다시 시도해주세요.');

    // 주문 상품 생성 (서버에서 검증된 가격/이름 사용)
    const orderItems = verifiedItems.map((item) => ({
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
      throw new Error(`주문 상품 저장에 실패했습니다: ${itemsError.message}`);
    }

    // 재고 즉시 차감 (무통장입금만 - 카카오페이는 approve 시점에 차감)
    if (!options.skipStockDecrement) {
      inventoryService.decrementStock(verifiedItems as StockableItem[]).catch((err) =>
        console.error('Stock decrement failed:', err)
      );
    }

    // 쿠폰 사용 횟수 증가 (무통장입금만 — 카카오페이는 approve 시점에 처리)
    if (validatedCouponId !== null && paymentMethod !== '카카오페이') {
      supabaseAdmin
        .from('coupons')
        .update({ used_count: validatedCouponUsedCount + 1, updated_at: new Date().toISOString() })
        .eq('id', validatedCouponId)
        .then(({ error }) => { if (error) console.error('Coupon increment failed:', error); });
    }

    // 알림 발송 (카카오페이는 approve 시점에 발송)
    if (!options.skipNotification) {
      await notificationService.notifyOrderCreated({
        orderNumber: order.order_number,
        customerName,
        customerEmail: customerEmail ?? null,
        customerPhone,
        totalAmount: order.total_amount,
        shippingFee: order.shipping_fee,
        depositorName: depositorName || customerName,
        items: verifiedItems.map((i) => ({
          productName: i.productName,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        address,
        addressDetail: addressDetail ?? null,
        siteUrl,
        paymentMethod: paymentMethod ?? '무통장입금',
      });
    }

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
    options: { sendNotification: boolean; trackingNumber?: string; carrier?: string },
    siteUrl: string
  ) {
    if (!this.isValidStatus(status)) {
      throw Object.assign(new Error('유효하지 않은 상태입니다.'), { status: 400 });
    }

    // 현재 주문 상태 조회 (재고 차감 판단용)
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status, payment_method, order_items(product_id, size, quantity)')
      .eq('id', orderId)
      .single();

    const updateData: Record<string, unknown> = { status };
    if (options.trackingNumber && status === OrderStatus.SHIPPING) {
      updateData.tracking_number = options.trackingNumber;
    }
    if (status === OrderStatus.DELIVERED) {
      updateData.delivered_at = new Date().toISOString();
    }
    if (status === OrderStatus.CANCELLED) {
      updateData.cancel_refund_completed = true;
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

    // 입금확인 또는 발송지연으로 전환 시 재고 차감
    // 카카오페이만: 주문 생성 시 skipStockDecrement=true로 생성되므로 여기서 차감
    // 무통장입금: 주문 생성 시 이미 차감했으므로 여기서 다시 차감하면 이중 차감됨
    const isKakaoPay = currentOrder?.payment_method === '카카오페이';
    if (isConfirmedStatus(status) && isKakaoPay && currentOrder && !isConfirmedStatus(currentOrder.status)) {
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
        carrier: options.carrier,
        siteUrl,
      });
    }

    return { order: data };
  }

  // 재고가 차감된 상태인지 판단 (휴지통 이동/복구 시 재고 처리용)
  private wasStockDecremented(status: string, paymentMethod: string): boolean {
    // 취소된 주문은 이미 재고 복구됨
    // CANCELLED: cancelOrder()에서 이미 재고 복구됨 → 휴지통 이동 시 재복구 불필요
    // CANCEL_REQUESTED: 아직 재고 차감 상태 → 휴지통 이동 시 복구 필요
    if (status === OrderStatus.CANCELLED) return false;
    // 카카오페이: 결제 완료 전에는 차감 안 됨
    if (paymentMethod === '카카오페이') {
      return status !== OrderStatus.KAKAO_PAY_PENDING && status !== OrderStatus.PENDING_PAYMENT;
    }
    // 무통장입금: 주문 생성 시 즉시 차감
    return true;
  }

  // 주문 소프트 삭제 (휴지통으로 이동) + 재고 즉시 복구
  async deleteOrder(orderId: string) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, payment_method, order_items(product_id, size, quantity)')
      .eq('id', orderId)
      .is('deleted_at', null)
      .single();

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', orderId)
      .is('deleted_at', null);

    if (error) {
      console.error('Order soft delete error:', error);
      throw new Error(`주문 삭제에 실패했습니다: ${error.message}`);
    }

    if (order && this.wasStockDecremented(order.status, order.payment_method)) {
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      const stockItems = items.filter((i) => i.product_id);
      if (stockItems.length > 0) {
        await inventoryService.restoreStock(
          stockItems.map((i) => ({ product_id: i.product_id!, size: i.size, quantity: i.quantity }))
        );
      }
    }

    return { success: true };
  }

  // 휴지통에서 복구 + 재고 다시 차감
  async restoreOrder(orderId: string) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, payment_method, order_items(product_id, size, quantity)')
      .eq('id', orderId)
      .not('deleted_at', 'is', null)
      .single();

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ deleted_at: null })
      .eq('id', orderId)
      .not('deleted_at', 'is', null);

    if (error) {
      console.error('Order restore error:', error);
      throw new Error(`주문 복구에 실패했습니다: ${error.message}`);
    }

    if (order && this.wasStockDecremented(order.status, order.payment_method)) {
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      for (const item of items) {
        if (item.product_id) {
          await inventoryService.adjustStock(item.product_id, item.size, -item.quantity);
        }
      }
    }

    return { success: true };
  }

  // 영구 삭제 (재고는 휴지통 이동 시 이미 복구됨)
  async permanentDeleteOrder(orderId: string) {
    const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('Order permanent delete error:', error);
      throw new Error(`영구 삭제에 실패했습니다: ${error.message}`);
    }

    return { success: true };
  }

  // 주문 취소
  async cancelOrder(payload: {
    orderNumber: string;
    phone: string;
    reason: string;
    refundBank?: string;
    refundAccount?: string;
    refundHolder?: string;
  }, siteUrl: string) {
    const { orderNumber, phone, reason, refundBank, refundAccount, refundHolder } = payload;

    if (!orderNumber || !phone || !reason) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(product_id, size, quantity)')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single();

    if (orderError || !order) {
      throw Object.assign(new Error('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.'), { status: 404 });
    }

    if (!(CANCELLABLE_STATUSES as readonly string[]).includes(order.status)) {
      throw Object.assign(new Error('취소할 수 없는 주문 상태입니다.'), { status: 400 });
    }

    const isKakao = order.payment_method === '카카오페이';
    // 입금대기(무통장)는 아직 미결제 → 환불 불필요, 바로 취소완료
    const isPendingUnpaid = order.status === OrderStatus.PENDING_PAYMENT && !isKakao;

    if (!isKakao && !isPendingUnpaid && (!refundBank || !refundAccount || !refundHolder)) {
      throw Object.assign(new Error('환불 받으실 계좌 정보를 입력해주세요.'), { status: 400 });
    }

    // 배송중이면 배송비 제외, 입금대기 미결제면 0, 그 외 전액 환불
    const refundAmount = isPendingUnpaid
      ? 0
      : order.status === OrderStatus.SHIPPING
        ? order.total_amount - order.shipping_fee
        : order.total_amount;

    const updateData: Record<string, unknown> = {
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancel_refund_amount: refundAmount,
    };

    if (isPendingUnpaid) {
      // 미결제 취소: 즉시 취소완료 (환불 불필요)
      updateData.status = OrderStatus.CANCELLED;
      updateData.cancel_refund_completed = true;
    } else if (!isKakao) {
      updateData.cancel_refund_bank = refundBank;
      updateData.cancel_refund_account = refundAccount;
      updateData.cancel_refund_holder = refundHolder;
      updateData.status = OrderStatus.CANCEL_REQUESTED;
    }

    // 카카오페이: cancel API 호출 후 즉시 취소완료
    if (isKakao) {
      if (!order.kakao_tid) {
        throw Object.assign(new Error('결제 정보를 찾을 수 없습니다.'), { status: 400 });
      }
      const kakaoConfig = getKakaoPayConfig();
      const kakaoRes = await fetch('https://open-api.kakaopay.com/online/v1/payment/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `SECRET_KEY ${kakaoConfig.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid: kakaoConfig.cid,
          tid: order.kakao_tid,
          cancel_amount: refundAmount,
          cancel_tax_free_amount: refundAmount,
        }),
      });

      if (!kakaoRes.ok) {
        const err = await kakaoRes.json().catch(() => ({}));
        console.error('KakaoPay cancel error:', err);
        throw new Error('카카오페이 환불에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      updateData.status = OrderStatus.CANCELLED;
      updateData.cancel_refund_completed = true;
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`취소 처리에 실패했습니다: ${updateError.message}`);
    }

    // 재고 복구
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const stockItems = items.filter((i: { product_id: number | null }) => i.product_id);
    if (stockItems.length > 0) {
      await inventoryService.restoreStock(
        stockItems.map((i: { product_id: number; size: string; quantity: number }) => ({
          product_id: i.product_id,
          size: i.size,
          quantity: i.quantity,
        }))
      );
    }

    // 알림 발송
    notificationService.notifyOrderCancelled({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      refundAmount,
      paymentMethod: order.payment_method,
      cancelRefundBank: refundBank,
      cancelRefundAccount: refundAccount,
      cancelRefundHolder: refundHolder,
      reason,
      siteUrl,
    });

    return { refundAmount, paymentMethod: order.payment_method };
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
