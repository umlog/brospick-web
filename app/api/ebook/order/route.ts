import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEbookOrderConfirmation, sendEbookOrderNotification } from '@/lib/email/ebook-emails';
import { EBOOK } from '@/app/ebook/ebook.config';

const EBOOK_PRICE = EBOOK.price;

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `EBOOK-${dateStr}-${random}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^01[0-9][-\s]?\d{3,4}[-\s]?\d{4}$/.test(phone.trim());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { name, phone, email, privacyConsent, contactConsent } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: '이름을 올바르게 입력해주세요.' }, { status: 400 });
  }
  if (typeof phone !== 'string' || !isValidPhone(phone)) {
    return NextResponse.json({ error: '연락처를 올바르게 입력해주세요.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: '이메일을 올바르게 입력해주세요.' }, { status: 400 });
  }
  if (!privacyConsent || !contactConsent) {
    return NextResponse.json({ error: '필수 동의 항목에 모두 동의해주세요.' }, { status: 400 });
  }

  const orderNumber = generateOrderNumber();

  const { error: dbError } = await supabaseAdmin.from('ebook_orders').insert({
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    order_number: orderNumber,
    amount: EBOOK_PRICE,
    privacy_consent: true,
    contact_consent: true,
    status: 'pending_payment',
  });

  if (dbError) {
    console.error('[ebook/order] DB insert error:', dbError);
    return NextResponse.json({ error: '주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }

  const emailData = {
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    orderNumber,
    amount: EBOOK_PRICE,
  };

  // 이메일 발송 실패 시에도 주문 성공으로 처리
  await Promise.allSettled([
    sendEbookOrderConfirmation(emailData),
    sendEbookOrderNotification(emailData),
  ]);

  return NextResponse.json({ success: true, orderNumber });
}
