// =============================================================================
// ReturnService - 반품/교환 관련 비즈니스 로직
// app/api/returns/route.ts 와 app/api/returns/[id]/route.ts 에서 추출
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase';
import { inventoryService } from './inventory.service';
import { notificationService } from './notification.service';
import { OrderStatus, ReturnStatus, ReturnType } from '@/lib/domain/enums';
import { RETURN_STATUS_TRANSITIONS } from '@/lib/domain/constants';
import { RETURN_POLICY } from '@/lib/constants';

function generateRequestNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `RR-${date}-${random}${suffix}`;
}

interface CreateReturnPayload {
  orderNumber: string;
  phone: string;
  orderItemId: string;
  type: ReturnType | string;
  reason: string;
  exchangeSize?: string;
  quantity?: number;
  refundBank?: string;
  refundAccount?: string;
  refundHolder?: string;
}

interface UpdateReturnStatusOptions {
  status: string;
  rejectReason?: string;
  returnTrackingNumber?: string;
  refundCompleted?: boolean;
  sendNotification?: boolean;
}

export class ReturnService {
  // 반품/교환 목록 조회
  async listReturnRequests(filter?: { status?: string }) {
    let query = supabaseAdmin
      .from('return_requests')
      .select(`
        *,
        orders (order_number, customer_name, customer_phone, customer_email, address, address_detail, postal_code),
        order_items (product_name, size, quantity, price)
      `)
      .order('created_at', { ascending: false });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`교환/반품 목록 조회에 실패했습니다: ${error.message}`);
    return { requests: data };
  }

  // 반품/교환 신청 생성
  async createReturnRequest(payload: CreateReturnPayload, siteUrl: string) {
    const { orderNumber, phone, orderItemId, type, reason, exchangeSize, quantity, refundBank, refundAccount, refundHolder } = payload;

    // 필수 필드 검증
    if (!orderNumber || !phone || !orderItemId || !type || !reason) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }

    if (![ReturnType.EXCHANGE, ReturnType.RETURN].includes(type as ReturnType)) {
      throw Object.assign(new Error('유효하지 않은 요청 유형입니다.'), { status: 400 });
    }

    if (type === ReturnType.EXCHANGE && !exchangeSize) {
      throw Object.assign(new Error('교환 희망 사이즈를 선택해주세요.'), { status: 400 });
    }

    if (type === ReturnType.RETURN && (!refundBank || !refundAccount || !refundHolder)) {
      throw Object.assign(new Error('환불 계좌 정보를 입력해주세요.'), { status: 400 });
    }

    // 주문 조회 + 인증 (주문번호 + 전화번호)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, delivered_at, customer_name, customer_phone, customer_email')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single();

    if (orderError || !order) {
      throw Object.assign(new Error('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.'), { status: 404 });
    }

    // 배송완료 상태 확인
    if (order.status !== OrderStatus.DELIVERED) {
      throw Object.assign(new Error('배송완료된 주문만 교환/반품 신청이 가능합니다.'), { status: 400 });
    }

    // 7일 이내 확인
    if (order.delivered_at) {
      const diffDays = (Date.now() - new Date(order.delivered_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > RETURN_POLICY.windowDays) {
        throw Object.assign(
          new Error(`배송완료 후 ${RETURN_POLICY.windowDays}일이 지나 교환/반품 신청이 불가합니다.`),
          { status: 400 }
        );
      }
    }

    // 주문 아이템 확인
    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_name, size, quantity, price')
      .eq('id', orderItemId)
      .eq('order_id', order.id)
      .single();

    if (itemError || !orderItem) {
      throw Object.assign(new Error('해당 주문 상품을 찾을 수 없습니다.'), { status: 404 });
    }

    // 활성 요청 중복 체크
    const { data: existingRequests } = await supabaseAdmin
      .from('return_requests')
      .select('id')
      .eq('order_item_id', orderItemId)
      .not('status', 'in', '("처리완료","거절")');

    if (existingRequests && existingRequests.length > 0) {
      throw Object.assign(new Error('이미 진행 중인 교환/반품 요청이 있습니다.'), { status: 400 });
    }

    const returnQuantity = quantity || orderItem.quantity;

    // 요청 생성 (요청번호 충돌 시 최대 3회 재시도)
    let requestNumber = '';
    let insertError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      requestNumber = generateRequestNumber();

      const insertData: Record<string, unknown> = {
        order_id: order.id,
        order_item_id: orderItemId,
        request_number: requestNumber,
        type,
        reason,
        quantity: returnQuantity,
        status: ReturnStatus.RECEIVED,
      };

      if (type === ReturnType.EXCHANGE) {
        insertData.exchange_size = exchangeSize;
        insertData.return_shipping_fee = RETURN_POLICY.exchangeShippingFee;
      }

      if (type === ReturnType.RETURN) {
        insertData.refund_bank = refundBank;
        insertData.refund_account = refundAccount;
        insertData.refund_holder = refundHolder;
        insertData.refund_amount = orderItem.price * returnQuantity - RETURN_POLICY.returnShippingFee;
        insertData.return_shipping_fee = RETURN_POLICY.returnShippingFee;
      }

      const result = await supabaseAdmin.from('return_requests').insert(insertData);
      insertError = result.error;
      if (!insertError) break;

      // UNIQUE 제약 위반이 아니면 즉시 실패
      if (!insertError.message?.includes('unique') && !insertError.code?.includes('23505')) break;
    }

    if (insertError) {
      console.error('Return request creation error:', insertError);
      throw new Error(`교환/반품 신청에 실패했습니다: ${insertError.message}`);
    }

    // 알림 발송 (비동기)
    notificationService.notifyReturnCreated({
      requestNumber,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      type,
      productName: orderItem.product_name,
      currentSize: orderItem.size,
      exchangeSize,
      reason,
      siteUrl,
    });

    return { requestNumber, status: ReturnStatus.RECEIVED };
  }

  // 반품/교환 상태 변경
  async updateReturnStatus(requestId: string, options: UpdateReturnStatusOptions, siteUrl: string) {
    const { status, rejectReason, returnTrackingNumber, refundCompleted, sendNotification } = options;

    // 현재 요청 조회
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('return_requests')
      .select(`
        *,
        orders (order_number, customer_name, customer_phone, customer_email),
        order_items (product_id, product_name, size, quantity, price)
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !current) {
      throw Object.assign(new Error('교환/반품 요청을 찾을 수 없습니다.'), { status: 404 });
    }

    // 상태 전이 검증 (domain constants의 state machine 사용)
    const allowed = RETURN_STATUS_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status as ReturnStatus)) {
      throw Object.assign(
        new Error(`'${current.status}'에서 '${status}'로 변경할 수 없습니다.`),
        { status: 400 }
      );
    }

    if (status === ReturnStatus.REJECTED && !rejectReason) {
      throw Object.assign(new Error('거절 사유를 입력해주세요.'), { status: 400 });
    }

    if (status === ReturnStatus.COLLECTING && !returnTrackingNumber) {
      throw Object.assign(new Error('반품 운송장번호를 입력해주세요.'), { status: 400 });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === ReturnStatus.REJECTED) updateData.reject_reason = rejectReason;
    if (status === ReturnStatus.COLLECTING) updateData.return_tracking_number = returnTrackingNumber;

    if (status === ReturnStatus.APPROVED && current.type === ReturnType.RETURN && !current.refund_amount) {
      const orderItem = Array.isArray(current.order_items) ? current.order_items[0] : current.order_items;
      if (orderItem?.price) {
        updateData.refund_amount = orderItem.price * current.quantity - RETURN_POLICY.returnShippingFee;
        updateData.return_shipping_fee = RETURN_POLICY.returnShippingFee;
      }
    }

    if (refundCompleted !== undefined) updateData.refund_completed = refundCompleted;

    const { data, error } = await supabaseAdmin
      .from('return_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Return request update error:', error);
      throw new Error(`상태 변경에 실패했습니다: ${error.message}`);
    }

    // 재고 조정
    const orderItem = Array.isArray(current.order_items) ? current.order_items[0] : current.order_items;
    const productId = orderItem?.product_id ?? null;

    // 교환 승인: 교환 사이즈 재고 차감
    if (status === ReturnStatus.APPROVED && current.type === ReturnType.EXCHANGE && current.exchange_size && productId) {
      await inventoryService.adjustStock(productId, current.exchange_size, -current.quantity);
    }

    // 처리완료: 원래 사이즈 재고 복구
    if (status === ReturnStatus.COMPLETED && orderItem?.size && productId) {
      await inventoryService.adjustStock(productId, orderItem.size, current.quantity);
    }

    // 알림 발송
    if (sendNotification && current.orders) {
      notificationService.notifyReturnStatusChanged({
        requestNumber: current.request_number,
        orderNumber: current.orders.order_number,
        customerName: current.orders.customer_name,
        customerEmail: current.orders.customer_email,
        customerPhone: current.orders.customer_phone,
        type: current.type,
        status,
        rejectReason,
        refundAmount: current.refund_amount || data.refund_amount,
        returnTrackingNumber,
        siteUrl,
      });
    }

    return { request: data };
  }

  // 반품/교환 삭제
  async deleteReturnRequest(requestId: string) {
    const { error } = await supabaseAdmin.from('return_requests').delete().eq('id', requestId);
    if (error) {
      console.error('Return request delete error:', error);
      throw new Error(`삭제에 실패했습니다: ${error.message}`);
    }
    return { success: true };
  }
}

export const returnService = new ReturnService();
