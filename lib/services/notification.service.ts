// =============================================================================
// NotificationService - 이메일 + 알림톡 발송 조율
// 기존에 각 API 라우트 핸들러 안에 인라인으로 흩어져 있던
// email + alimtalk 페어 발송 로직을 한 곳에 통합
// =============================================================================

import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
  sendStatusChangeEmail,
  sendPaymentReminderEmail,
  sendReturnRequestEmail,
  sendReturnStatusEmail,
} from '@/lib/email';
import {
  sendOrderAlimtalk,
  sendStatusAlimtalk,
  sendReturnRequestAlimtalk,
  sendReturnStatusAlimtalk,
} from '@/lib/kakao';
import type { ReturnType } from '@/lib/domain/enums';

export interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  totalAmount: number;
  shippingFee: number;
  depositorName: string;
  items: Array<{ productName: string; size: string; quantity: number; price: number }>;
  address: string;
  addressDetail?: string | null;
  siteUrl: string;
}

export interface StatusNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  productName: string;
  status: string;
  trackingNumber?: string | null;
  siteUrl: string;
}

export interface PaymentReminderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  siteUrl: string;
}

export interface ReturnCreatedData {
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  type: ReturnType | string;
  productName: string;
  currentSize: string;
  exchangeSize?: string;
  reason: string;
  siteUrl: string;
}

export interface ReturnStatusChangedData {
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  type: ReturnType | string;
  status: string;
  rejectReason?: string;
  refundAmount?: number | null;
  returnTrackingNumber?: string;
  siteUrl: string;
}

export class NotificationService {
  private trackingUrl(siteUrl: string, orderNumber: string): string {
    return `${siteUrl}/tracking?orderNumber=${encodeURIComponent(orderNumber)}`;
  }

  // 주문 생성 알림 (고객 확인 이메일 + 관리자 알림 + 알림톡)
  notifyOrderCreated(data: OrderNotificationData): void {
    const trackingUrl = this.trackingUrl(data.siteUrl, data.orderNumber);

    if (data.customerEmail) {
      sendOrderConfirmationEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        totalAmount: data.totalAmount,
        shippingFee: data.shippingFee,
        depositorName: data.depositorName,
        items: data.items,
        address: data.address,
        addressDetail: data.addressDetail ?? undefined,
        trackingUrl,
      }).catch((err) => console.error('Order confirmation email error:', err));
    }

    sendNewOrderNotificationEmail({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail ?? '',
      totalAmount: data.totalAmount,
      shippingFee: data.shippingFee,
      depositorName: data.depositorName,
      items: data.items,
      address: data.address,
      addressDetail: data.addressDetail ?? undefined,
      trackingUrl,
    }).catch((err) => console.error('Admin notification email error:', err));

    const productNames = data.items.map((i) => i.productName).join(', ');
    sendOrderAlimtalk({
      customerPhone: data.customerPhone,
      orderNumber: data.orderNumber,
      productName: productNames,
      totalAmount: data.totalAmount,
      depositorName: data.depositorName,
      siteUrl: data.siteUrl,
    }).catch((err) => console.error('Order alimtalk error:', err));
  }

  // 주문 상태 변경 알림 (이메일 + 알림톡)
  notifyStatusChanged(data: StatusNotificationData): void {
    const trackingUrl = this.trackingUrl(data.siteUrl, data.orderNumber);

    if (data.customerEmail) {
      sendStatusChangeEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        status: data.status,
        trackingUrl,
        trackingNumber: data.trackingNumber ?? undefined,
      }).catch((err) => console.error('Status change email error:', err));
    }

    sendStatusAlimtalk({
      customerPhone: data.customerPhone,
      orderNumber: data.orderNumber,
      productName: data.productName,
      status: data.status,
      siteUrl: data.siteUrl,
    }).catch((err) => console.error('Status change alimtalk error:', err));
  }

  // 입금 안내 메일
  async notifyPaymentReminder(data: PaymentReminderData): Promise<void> {
    const trackingUrl = this.trackingUrl(data.siteUrl, data.orderNumber);
    await sendPaymentReminderEmail({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      totalAmount: data.totalAmount,
      trackingUrl,
    });
  }

  // 반품/교환 접수 알림 (이메일 + 알림톡)
  notifyReturnCreated(data: ReturnCreatedData): void {
    const trackingUrl = this.trackingUrl(data.siteUrl, data.orderNumber);

    if (data.customerEmail) {
      sendReturnRequestEmail({
        requestNumber: data.requestNumber,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        type: data.type as ReturnType,
        productName: data.productName,
        currentSize: data.currentSize,
        exchangeSize: data.exchangeSize,
        reason: data.reason,
        trackingUrl,
      }).catch((err) => console.error('Return request email error:', err));
    }

    sendReturnRequestAlimtalk({
      customerPhone: data.customerPhone,
      requestNumber: data.requestNumber,
      orderNumber: data.orderNumber,
      type: data.type,
      productName: data.productName,
      siteUrl: data.siteUrl,
    }).catch((err) => console.error('Return request alimtalk error:', err));
  }

  // 반품/교환 상태 변경 알림 (이메일 + 알림톡)
  notifyReturnStatusChanged(data: ReturnStatusChangedData): void {
    const trackingUrl = this.trackingUrl(data.siteUrl, data.orderNumber);

    if (data.customerEmail) {
      sendReturnStatusEmail({
        requestNumber: data.requestNumber,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        type: data.type as ReturnType,
        status: data.status,
        rejectReason: data.rejectReason,
        refundAmount: data.refundAmount ?? undefined,
        returnTrackingNumber: data.returnTrackingNumber,
        trackingUrl,
      }).catch((err) => console.error('Return status email error:', err));
    }

    sendReturnStatusAlimtalk({
      customerPhone: data.customerPhone,
      requestNumber: data.requestNumber,
      orderNumber: data.orderNumber,
      type: data.type,
      status: data.status,
      siteUrl: data.siteUrl,
    }).catch((err) => console.error('Return status alimtalk error:', err));
  }
}

export const notificationService = new NotificationService();
