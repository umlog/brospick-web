import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const validToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!validToken || key !== validToken) {
    return new NextResponse(null, { status: 404 });
  }

  // 리다이렉트 방식은 모바일 브라우저/WebView에서 redirect + Set-Cookie 타이밍 문제가 발생할 수 있음.
  // HTML을 직접 반환해 쿠키가 먼저 저장된 후 JS로 이동하도록 처리.
  const cookieOptions = [
    `admin_access=${validToken}`,
    'HttpOnly',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Lax',
    'Max-Age=604800',
    'Path=/',
  ].filter(Boolean).join('; ');

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/admin">
</head>
<body>
  <script>window.location.replace('/admin');</script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': cookieOptions,
        'Cache-Control': 'no-store',
      },
    }
  );
}
