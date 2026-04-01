import { NextRequest, NextResponse } from 'next/server';

async function verifySession(cookieValue: string, adminPassword: string): Promise<boolean> {
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return false;

  const [nonce, timestamp, receivedHmac] = parts;

  // 토큰 만료 검사 (7일)
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(tokenAge) || tokenAge < 0 || tokenAge > 7 * 24 * 60 * 60 * 1000) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(adminPassword),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${nonce}.${timestamp}`)
    );

    const expectedHmac = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedHmac === receivedHmac;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionValue = request.cookies.get('admin_session')?.value;

  const isValid =
    !!adminPassword && !!sessionValue && (await verifySession(sessionValue, adminPassword));

  // /admin/login: 로그인된 경우 /admin으로 리다이렉트, 아니면 통과
  if (pathname === '/admin/login') {
    if (isValid) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 나머지 /admin/* 경로: 세션 없으면 로그인 페이지로 리다이렉트
  if (!isValid) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
