import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessCookie = request.cookies.get('admin_access');
  const validToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!validToken || accessCookie?.value !== validToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, token: validToken });
}
