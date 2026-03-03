import { NextResponse } from 'next/server';

export async function POST() {
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_session=; HttpOnly; Path=/; Max-Age=0',
    },
  });
}
