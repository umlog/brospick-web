import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, apiError } from '@/lib/errors';
import { orderService } from '@/lib/services';
import { supabaseAdmin } from '@/lib/supabase';
import { getKakaoPayConfig } from '@/lib/kakao-pay';
import { OrderStatus } from '@/lib/domain/enums';

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '';

    let kakaoConfig;
    try {
      kakaoConfig = getKakaoPayConfig();
    } catch {
      return apiError('카카오페이 설정이 없습니다.', 500);
    }

    const {
      customerName, customerPhone, customerEmail,
      postalCode, address, addressDetail,
      totalAmount, shippingFee, deliveryNote, items,
      privacyConsent, thirdPartyConsent, marketingConsent,
    } = body;

    // 주문 생성 (재고 차감/알림은 approve 시점에 처리)
    let orderNumber: string;
    try {
      const result = await orderService.createOrder(
        {
          customerName, customerPhone, customerEmail,
          postalCode, address, addressDetail,
          totalAmount, shippingFee, deliveryNote, items,
          privacyConsent, thirdPartyConsent, marketingConsent,
          paymentMethod: '카카오페이',
        },
        siteUrl,
        { skipStockDecrement: true, skipNotification: true }
      );
      orderNumber = result.orderNumber;
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = (e.status === 400 || e.status === 409) ? e.status : 500;
      return apiError(e.message || '주문 생성에 실패했습니다.', status as 400 | 409 | 500);
    }

    const itemName = items.length === 1
      ? items[0].productName
      : `${items[0].productName} 외 ${items.length - 1}건`;

    // KakaoPay Ready API 호출
    const kakaoRes = await fetch('https://open-api.kakaopay.com/online/v1/payment/ready', {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${kakaoConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: kakaoConfig.cid,
        partner_order_id: orderNumber,
        partner_user_id: customerPhone,
        item_name: itemName,
        quantity: items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
        total_amount: totalAmount,
        vat_amount: 0,
        tax_free_amount: totalAmount,
        approval_url: `${siteUrl}/api/payment/kakao/approve?order=${orderNumber}`,
        cancel_url: `${siteUrl}/api/payment/kakao/cancel?order=${orderNumber}`,
        fail_url: `${siteUrl}/api/payment/kakao/fail?order=${orderNumber}`,
      }),
    });

    if (!kakaoRes.ok) {
      // 카카오페이 준비 실패 시 임시 주문 삭제
      await supabaseAdmin.from('orders').delete().eq('order_number', orderNumber);
      const err = await kakaoRes.json().catch(() => ({}));
      console.error('KakaoPay ready error:', err);
      return apiError('카카오페이 결제 준비에 실패했습니다.', 500);
    }

    const kakaoData = await kakaoRes.json();

    // 주문 상태를 '카카오페이 결제중'으로 변경 + TID 저장
    await supabaseAdmin
      .from('orders')
      .update({ kakao_tid: kakaoData.tid, status: OrderStatus.KAKAO_PAY_PENDING })
      .eq('order_number', orderNumber);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(request.headers.get('user-agent') || '');
    const redirectUrl = isMobile ? kakaoData.next_redirect_mobile_url : kakaoData.next_redirect_pc_url;

    return NextResponse.json({ redirectUrl, orderNumber });
  });
}
