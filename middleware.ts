import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const accessCookie = request.cookies.get('admin_access');
  const validToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!validToken || accessCookie?.value !== validToken) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
