import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

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

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const sessionToken = createSessionToken(adminPassword);

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
