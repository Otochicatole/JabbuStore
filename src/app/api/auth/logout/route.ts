import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function isHttpsRequest(request: NextRequest) {
  const protocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    request.nextUrl.protocol.replace(':', '');
  return protocol === 'https';
}

function clearAdminCookie(response: NextResponse, secure: boolean) {
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

function getSafeNextPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get('next') || '/en/admin/login';
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/en/admin/login';
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const nextPath = getSafeNextPath(request);
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  clearAdminCookie(response, isHttpsRequest(request));
  return response;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  
  cookieStore.set('admin_token', '', {
    httpOnly: true,
    secure: isHttpsRequest(request),
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });

  return NextResponse.json({ success: true });
}
