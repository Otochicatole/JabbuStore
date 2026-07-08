import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const protocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    request.nextUrl.protocol.replace(':', '');
  
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: protocol === 'https',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });

  return NextResponse.json({ success: true });
}
