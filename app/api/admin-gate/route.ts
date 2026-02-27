import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const validToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!validToken || key !== validToken) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.redirect(new URL('/admin', request.url));
  response.cookies.set('admin_access', validToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: '/',
  });

  return response;
}
