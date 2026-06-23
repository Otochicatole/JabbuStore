import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function clearAdminCookie(response: NextResponse) {
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
  clearAdminCookie(response);
  return response;
}

export async function POST() {
  const cookieStore = await cookies();
  
  cookieStore.set('admin_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0),
    path: '/',
  });

  return NextResponse.json({ success: true });
}
