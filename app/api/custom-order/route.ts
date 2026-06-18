import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { escapeHtml, sendMail } from '@/lib/email/transporter';

function buildHtml(description: string, quantity: string, imageUrl: string): string {
  return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
      <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
        <p style="color:#b3b3b3;font-size:14px;margin:0;">커스텀 부츠스킨 주문 문의</p>
      </div>
      <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
        <h3 style="font-size:16px;color:#333;margin:0 0 20px;">새 커스텀 주문 문의가 도착했습니다.</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;width:28%;">수량</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(quantity)}세트</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;vertical-align:top;">디자인 설명</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;white-space:pre-wrap;">${escapeHtml(description)}</td>
          </tr>
          ${imageUrl ? `
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-size:13px;color:#666;vertical-align:top;">참고 이미지</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">
              <a href="${imageUrl}" style="color:#2563eb;font-size:14px;display:block;margin-bottom:8px;">이미지 보기</a>
              <img src="${imageUrl}" style="max-width:100%;max-height:300px;border-radius:4px;" alt="참고 이미지"/>
            </td>
          </tr>
          ` : ''}
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
    const quantity = (formData.get('quantity') as string | null) ?? '10';
    const file = formData.get('image') as File | null;

    if (!description) {
      return NextResponse.json({ error: '디자인 설명이 필요합니다.' }, { status: 400 });
    }

    let imageUrl = '';
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${Date.now()}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from('custom-order-images')
        .upload(fileName, bytes, { contentType: file.type, upsert: false });

      if (!error && data) {
        const { data: urlData } = supabaseAdmin.storage
          .from('custom-order-images')
          .getPublicUrl(data.path);
        imageUrl = urlData.publicUrl;
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;
    await sendMail(adminEmail, '[BROSPICK] 커스텀 부츠스킨 주문 문의', buildHtml(description, quantity, imageUrl));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[custom-order]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
