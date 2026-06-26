import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { escapeHtml, sendMail } from '@/lib/email/transporter';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { sendOrderAlimtalk } from '@/lib/kakao';
import { getKakaoPayConfig } from '@/lib/kakao-pay';
import { OrderStatus } from '@/lib/domain/enums';

const PRICE_PER_SET = 5000;
// 최소 주문 10세트(=50,000원)라 무료배송 기준(5만원 이상)을 항상 충족하므로 배송비 없음
const SHIPPING_FEE = 0;

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BP-${date}-${random}`;
}

function buildAdminHtml(p: {
  description: string;
  quantity: number;
  imageUrl: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  addressDetail: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  depositorName: string;
}): string {
  return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
      <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
        <p style="color:#b3b3b3;font-size:14px;margin:0;">커스텀 부츠스킨 단체주문</p>
      </div>
      <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
        <h3 style="font-size:16px;color:#333;margin:0 0 20px;">새 단체주문이 접수되었습니다.</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;width:28%;">주문번호</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">신청자</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.customerName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">연락처</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.customerPhone)}</td>
          </tr>
          ${p.customerEmail ? `
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">이메일</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.customerEmail)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">배송지</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.address)}${p.addressDetail ? ' ' + escapeHtml(p.addressDetail) : ''}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">수량</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${p.quantity}세트</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">결제방법</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(p.paymentMethod)}${p.depositorName ? ` (입금자: ${escapeHtml(p.depositorName)})` : ''}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;">결제금액</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;font-weight:600;">${p.totalAmount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;vertical-align:top;">디자인 설명</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;white-space:pre-wrap;">${escapeHtml(p.description)}</td>
          </tr>
          ${p.imageUrl ? `
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;vertical-align:top;">참고 이미지</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">
              <a href="${p.imageUrl}" style="color:#2563eb;font-size:14px;display:block;margin-bottom:8px;">이미지 보기</a>
              <img src="${p.imageUrl}" style="max-width:100%;max-height:300px;border-radius:4px;" alt="참고 이미지"/>
            </td>
          </tr>` : ''}
        </table>
      </div>
      <div style="padding:20px 24px;background:#f8f8f8;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;text-align:center;">
        <p style="font-size:12px;color:#999;margin:0;">BROSPICK 커스텀 부츠스킨 주문 시스템</p>
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const description = (formData.get('description') as string | null)?.trim() ?? '';
    const quantity = Math.max(10, parseInt((formData.get('quantity') as string | null) ?? '10', 10));
    const file = formData.get('image') as File | null;
    const customerName = (formData.get('customerName') as string | null)?.trim() ?? '';
    const customerPhone = (formData.get('customerPhone') as string | null)?.trim() ?? '';
    const customerEmail = (formData.get('customerEmail') as string | null)?.trim() ?? '';
    const postalCode = (formData.get('postalCode') as string | null)?.trim() ?? '';
    const address = (formData.get('address') as string | null)?.trim() ?? '';
    const addressDetail = (formData.get('addressDetail') as string | null)?.trim() ?? '';
    const paymentMethod = (formData.get('paymentMethod') as string | null) ?? 'bank';
    const depositorName = (formData.get('depositorName') as string | null)?.trim() ?? '';
    const privacyConsent = formData.get('privacyConsent') === 'true';
    const thirdPartyConsent = formData.get('thirdPartyConsent') === 'true';

    if (!description) return NextResponse.json({ error: '디자인 설명이 필요합니다.' }, { status: 400 });
    if (!customerName) return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    if (!customerPhone) return NextResponse.json({ error: '연락처를 입력해주세요.' }, { status: 400 });
    if (!postalCode || !address) return NextResponse.json({ error: '배송지 주소를 입력해주세요.' }, { status: 400 });
    if (!privacyConsent || !thirdPartyConsent) return NextResponse.json({ error: '필수 약관에 동의해주세요.' }, { status: 400 });

    // 이미지 업로드
    let imageUrl = '';
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${Date.now()}.${ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from('custom-order-images')
        .upload(fileName, bytes, { contentType: file.type, upsert: false });
      if (!error && data) {
        const { data: urlData } = supabaseAdmin.storage.from('custom-order-images').getPublicUrl(data.path);
        imageUrl = urlData.publicUrl;
      }
    }

    // 디자인 설명 + 이미지 URL을 delivery_note에 함께 저장
    const deliveryNote = imageUrl
      ? `${description}\n\n[참고이미지] ${imageUrl}`
      : description;

    const totalAmount = quantity * PRICE_PER_SET + SHIPPING_FEE;
    const isKakao = paymentMethod === 'kakaopay';
    const dbPaymentMethod = isKakao ? '카카오페이' : '무통장입금';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

    // 주문 생성 (번호 충돌 시 최대 3회 재시도)
    let orderNumber = '';
    let orderId = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const num = generateOrderNumber();
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: num,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          postal_code: postalCode,
          address,
          address_detail: addressDetail || null,
          total_amount: totalAmount,
          shipping_fee: SHIPPING_FEE,
          depositor_name: isKakao ? null : (depositorName || customerName),
          delivery_note: deliveryNote,
          payment_method: dbPaymentMethod,
          status: OrderStatus.PENDING_PAYMENT,
          privacy_consent: privacyConsent,
          third_party_consent: thirdPartyConsent,
          marketing_consent: false,
        })
        .select('id, order_number')
        .single();

      if (!error && data) {
        orderNumber = data.order_number;
        orderId = data.id;
        break;
      }
      if (attempt === 2) throw new Error('주문 생성 실패');
    }

    // 주문 상품 등록
    await supabaseAdmin.from('order_items').insert({
      order_id: orderId,
      product_name: '부츠스킨 커스텀',
      size: '-',
      quantity,
      price: PRICE_PER_SET,
      product_id: null,
    });

    // 관리자 이메일 (비동기)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;
    sendMail(
      adminEmail,
      `[BROSPICK] 커스텀 부츠스킨 단체주문 - ${customerName}`,
      buildAdminHtml({
        description,
        quantity,
        imageUrl,
        customerName,
        customerPhone,
        customerEmail,
        address,
        addressDetail,
        orderNumber,
        totalAmount,
        paymentMethod: dbPaymentMethod,
        depositorName,
      })
    ).catch((err) => console.error('[custom-order] admin email error:', err));

    // 카카오페이 결제
    if (isKakao) {
      let kakaoConfig;
      try {
        kakaoConfig = getKakaoPayConfig();
      } catch {
        await supabaseAdmin.from('orders').delete().eq('order_number', orderNumber);
        return NextResponse.json({ error: '카카오페이 설정 오류가 발생했습니다.' }, { status: 500 });
      }

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
          item_name: `부츠스킨 커스텀 ${quantity}세트`,
          quantity,
          total_amount: totalAmount,
          vat_amount: 0,
          tax_free_amount: totalAmount,
          approval_url: `${siteUrl}/api/payment/kakao/approve?order=${orderNumber}`,
          cancel_url: `${siteUrl}/api/payment/kakao/cancel?order=${orderNumber}`,
          fail_url: `${siteUrl}/api/payment/kakao/fail?order=${orderNumber}`,
        }),
      });

      if (!kakaoRes.ok) {
        await supabaseAdmin.from('orders').delete().eq('order_number', orderNumber);
        const err = await kakaoRes.json().catch(() => ({}));
        console.error('[custom-order] kakao ready error:', err);
        return NextResponse.json({ error: '카카오페이 결제 준비에 실패했습니다.' }, { status: 500 });
      }

      const kakaoData = await kakaoRes.json();
      const userAgent = req.headers.get('user-agent') || '';
      const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

      await supabaseAdmin
        .from('orders')
        .update({ kakao_tid: kakaoData.tid, status: OrderStatus.KAKAO_PAY_PENDING })
        .eq('order_number', orderNumber);

      return NextResponse.json({
        type: 'kakao',
        redirectUrl: isMobile ? kakaoData.next_redirect_mobile_url : kakaoData.next_redirect_pc_url,
      });
    }

    // 무통장입금 — 고객 알림 발송 (비동기)
    const trackingUrl = `${siteUrl}/tracking?orderNumber=${encodeURIComponent(orderNumber)}`;

    sendOrderAlimtalk({
      customerPhone,
      orderNumber,
      productName: `부츠스킨 커스텀 ${quantity}세트`,
      totalAmount,
      depositorName: depositorName || customerName,
      siteUrl,
    }).catch((err) => console.error('[custom-order] alimtalk error:', err));

    if (customerEmail) {
      sendOrderConfirmationEmail({
        orderNumber,
        customerName,
        customerEmail,
        totalAmount,
        shippingFee: SHIPPING_FEE,
        depositorName: depositorName || customerName,
        items: [{ productName: `부츠스킨 커스텀 ${quantity}세트`, size: '-', quantity, price: PRICE_PER_SET }],
        address,
        addressDetail: addressDetail || undefined,
        trackingUrl,
        paymentMethod: '무통장입금',
      }).catch((err) => console.error('[custom-order] customer email error:', err));
    }

    return NextResponse.json({ type: 'bank', orderNumber, totalAmount, shippingFee: SHIPPING_FEE });
  } catch (err) {
    console.error('[custom-order]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
