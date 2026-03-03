import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('admin_session');
  const validPassword = process.env.ADMIN_PASSWORD;
  const isValid = !!validPassword && session?.value === validPassword;

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
