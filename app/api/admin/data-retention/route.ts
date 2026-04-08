import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';

// 인증: 어드민 세션 쿠키 OR CRON_SECRET 헤더 (Netlify Scheduled Function 용)
function isAuthorized(request: NextRequest): boolean {
  // 1) 어드민 세션 쿠키
  if (checkAdminSession(request.cookies.get('admin_session')?.value)) return true;

  // 2) Cron secret (Netlify Scheduled Function 또는 외부 호출)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  return false;
}

// 개인정보 보존 정책 실행
// - 마케팅 동의: 동의 시점으로부터 3년 경과 시 marketing_consent = false
// - 주문 PII: 주문 후 5년 경과 시 익명화 (개인정보보호법 준수)
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const threeYearsAgo = new Date(Date.now() - 3 * 365.25 * 24 * 60 * 60 * 1000).toISOString();
    const fiveYearsAgo = new Date(Date.now() - 5 * 365.25 * 24 * 60 * 60 * 1000).toISOString();

    // 0) 1시간 이상 된 '카카오페이 결제중' 주문 삭제 (결제창 이탈 등으로 미완료된 주문)
    // 카카오페이 TID 자체 만료 시간이 15분이므로 1시간이면 충분히 안전
    const { data: kakaoExpiredData, error: kakaoExpiredError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('status', '카카오페이 결제중')
      .lt('created_at', oneHourAgo)
      .select('id');

    if (kakaoExpiredError) {
      console.error('[data-retention] 카카오페이 미완료 주문 삭제 오류:', kakaoExpiredError);
    }

    // 1) 3년 초과 마케팅 동의 초기화
    const { data: marketingData, error: marketingError } = await supabaseAdmin
      .from('orders')
      .update({ marketing_consent: false })
      .eq('marketing_consent', true)
      .lt('created_at', threeYearsAgo)
      .select('id');

    if (marketingError) {
      console.error('[data-retention] 마케팅 동의 초기화 오류:', marketingError);
      return apiError('마케팅 동의 초기화에 실패했습니다.', 500);
    }

    // 2) 5년 초과 주문 PII 익명화
    const { data: piiData, error: piiError } = await supabaseAdmin
      .from('orders')
      .update({
        customer_name: '(삭제됨)',
        customer_phone: '(삭제됨)',
        customer_email: null,
        address: '(삭제됨)',
        address_detail: null,
        postal_code: '00000',
      })
      .lt('created_at', fiveYearsAgo)
      .neq('customer_name', '(삭제됨)')
      .select('id');

    if (piiError) {
      console.error('[data-retention] PII 익명화 오류:', piiError);
      return apiError('PII 익명화에 실패했습니다.', 500);
    }

    return NextResponse.json({
      success: true,
      kakao_expired: kakaoExpiredData?.length ?? 0,
      marketing_cleared: marketingData?.length ?? 0,
      pii_anonymized: piiData?.length ?? 0,
      ran_at: now,
    });
  });
}
