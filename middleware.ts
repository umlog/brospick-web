import { NextRequest, NextResponse } from 'next/server';

async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return false;

  const [nonce, timestamp, receivedHmac] = parts;

  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(tokenAge) || tokenAge < 0 || tokenAge > 7 * 24 * 60 * 60 * 1000) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
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
  const adminPath = process.env.ADMIN_PATH || 'admin';
  const adminPrefix = `/${adminPath}`;
  // 세션 서명 키: 전용 SESSION_SECRET 우선, 없으면 ADMIN_PASSWORD로 폴백
  const sessionSecret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;

  // 직접 /admin 접근 차단 (커스텀 경로가 설정된 경우)
  if (adminPath !== 'admin' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return new NextResponse(null, { status: 404 });
  }

  // 어드민 경로가 아니면 통과
  if (pathname !== adminPrefix && !pathname.startsWith(`${adminPrefix}/`)) {
    return NextResponse.next();
  }

  // /{adminPath}/* → /admin/* 내부 경로 변환
  const internalPath =
    adminPath === 'admin' ? pathname : '/admin' + pathname.slice(adminPrefix.length);

  const sessionValue = request.cookies.get('admin_session')?.value;
  const isValid =
    !!sessionSecret && !!sessionValue && (await verifySession(sessionValue, sessionSecret));

  if (internalPath === '/admin/login') {
    if (isValid) {
      return NextResponse.redirect(new URL(adminPrefix, request.url));
    }
    if (adminPath !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (!isValid) {
    return NextResponse.redirect(new URL(`${adminPrefix}/login`, request.url));
  }

  if (adminPath !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일, 이미지, 파비콘 제외한 모든 경로에서 실행
  matcher: ['/((?!_next|favicon\\.ico|.*\\.[\\w]+$).*)'],
};
