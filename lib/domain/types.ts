// =============================================================================
// Domain Types - 모든 인터페이스의 단일 진실 공급원
// app/admin/types.ts, app/checkout/types.ts, lib/email.ts 인라인 타입들을 통합
// =============================================================================

import { ReturnStatus, SizeStatus, ReturnType } from './enums';

// -----------------------------------------------------------------------------
// 주문 관련
// -----------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  postal_code: string;
  address: string;
  address_detail: string | null;
  total_amount: number;
  shipping_fee: number;
  status: string; // string으로 유지 (동적 발송지연 상태 포함)
  depositor_name: string | null;
  delivery_note: string | null;
  payment_method: string;
  tracking_number?: string | null;
  delivered_at?: string | null;
  created_at: string;
  order_items: OrderItem[];
}

// -----------------------------------------------------------------------------
// 반품/교환 관련
// -----------------------------------------------------------------------------

export interface ReturnRequest {
  id: string;
  request_number: string;
  type: ReturnType;
  reason: string;
  status: ReturnStatus | string;
  exchange_size: string | null;
  quantity: number;
  reject_reason: string | null;
  refund_amount: number | null;
  refund_bank: string | null;
  refund_account: string | null;
  refund_holder: string | null;
  refund_completed: boolean;
  return_shipping_fee: number | null;
  return_tracking_number: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    address: string;
    address_detail: string | null;
    postal_code: string;
  };
  order_items: {
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  };
}

// -----------------------------------------------------------------------------
// 상품 재고
// -----------------------------------------------------------------------------

export interface ProductSize {
  product_id: number;
  size: string;
  status: SizeStatus;
  stock: number;
}

// -----------------------------------------------------------------------------
// 어드민 UI
// -----------------------------------------------------------------------------

export type AdminTab = 'orders' | 'returns' | 'products' | 'dashboard';

// -----------------------------------------------------------------------------
// 체크아웃 관련 (app/checkout/types.ts 에서 통합)
// -----------------------------------------------------------------------------

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressDetail: string;
  postalCode: string;
  depositorName: string;
  deliveryNote: string;
}

export interface OrderResponse {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
}

export interface ParsedAddress {
  postalCode: string;
  address: string;
}

// -----------------------------------------------------------------------------
// 이메일 데이터 타입 (lib/email.ts 인라인 타입에서 통합)
// -----------------------------------------------------------------------------

export interface EmailOrderItem {
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  shippingFee: number;
  depositorName: string;
  items: EmailOrderItem[];
  address: string;
  addressDetail?: string;
  trackingUrl: string;
}

export interface StatusChangeEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  trackingUrl: string;
  trackingNumber?: string;
}

export interface PaymentReminderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  trackingUrl: string;
}

export interface ReturnRequestEmailData {
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  type: ReturnType;
  productName: string;
  currentSize: string;
  exchangeSize?: string;
  reason: string;
  trackingUrl: string;
}

export interface ReturnStatusEmailData {
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  type: ReturnType;
  status: string;
  rejectReason?: string;
  refundAmount?: number;
  returnTrackingNumber?: string;
  trackingUrl: string;
}
