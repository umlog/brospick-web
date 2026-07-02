import { NextRequest, NextResponse } from 'next/server';
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';
import { sendMail } from '@/lib/email';
import { escapeHtml } from '@/lib/email/transporter';

// 인메모리 레이트 리미터 (서버 재시작 시 초기화됨)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15분

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function createSessionToken(secret: string): string {
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${nonce}.${timestamp}`;
  const hmac = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

// 타이밍 공격 방지 상수 시간 비교 (양쪽을 고정 길이 해시로 변환 후 비교 → 길이 노출도 방지)
function safeEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah, bh);
}

// 로그인 성공 알림 메일 (fire-and-forget — 실패해도 로그인은 정상 진행)
function sendLoginAlert(request: NextRequest, ip: string): void {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail) return;

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  // user-agent / ip 는 공격자 조작 가능 → HTML escape 후 삽입 (이메일 HTML 인젝션 방지)
  const userAgent = escapeHtml((request.headers.get('user-agent') || '알 수 없음').slice(0, 256));
  const safeIp = escapeHtml(ip);
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
      <div style="background:#121212;padding:20px 24px;">
        <h1 style="color:#fff;margin:0;font-size:18px;">🔐 BROSPICK 관리자 로그인</h1>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none;">
        <p style="margin:0 0 12px;">관리자 페이지에 로그인이 발생했습니다.</p>
        <p style="margin:0 0 12px;"><strong>시각:</strong> ${now}</p>
        <p style="margin:0 0 12px;"><strong>IP:</strong> ${safeIp}</p>
        <p style="margin:0;"><strong>기기:</strong> ${userAgent}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="margin:0;font-size:13px;color:#666;">본인이 아니라면 즉시 비밀번호를 변경하세요.</p>
      </div>
    </div>
  `;

  sendMail(adminEmail, `[BROSPICK] 관리자 로그인 알림 - ${now}`, html).catch((err) =>
    console.error('[admin/login] 로그인 알림 메일 실패:', err)
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    // 브루트포스 방어: 실패 시 최소 500ms 지연 (서버리스 인스턴스 간 공유 불가한 인메모리 카운터 보완)
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  // 세션 서명 키: 전용 SESSION_SECRET 우선, 없으면 ADMIN_PASSWORD로 폴백
  const sessionToken = createSessionToken(process.env.SESSION_SECRET || adminPassword);

  // 로그인 성공 알림 (비동기)
  sendLoginAlert(request, ip);

  const cookieOptions = [
    `admin_session=${sessionToken}`,
    'HttpOnly',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Strict',
    'Max-Age=604800',
    'Path=/',
  ].filter(Boolean).join('; ');

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieOptions,
    },
  });
}
