import { NextResponse } from 'next/server';

const backendBase = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

export async function GET(request: Request) {
  try {
    const originalUrl = new URL(request.url);
    const code = originalUrl.searchParams.get('code');

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    // Forzar la limpieza del puerto 3000 si estamos en un devtunnel
    const cleanHost = host.includes('devtunnels.ms') ? host.replace(':3000', '') : host;
    const baseUrl = `${protocol}://${cleanHost}/`;

    if (!code) {
      return NextResponse.redirect(baseUrl);
    }

    const sessionResponse = await fetch(`${backendBase}/auth/steam/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tunnel-Skip-AntiPhishing-Page': 'true',
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });

    if (!sessionResponse.ok) {
      return NextResponse.redirect(baseUrl);
    }

    const session = await sessionResponse.json().catch(() => null);
    const token = typeof session?.token === 'string' ? session.token : null;
    if (!token) {
      return NextResponse.redirect(baseUrl);
    }

    // Redirigir al inicio después de setear la cookie
    const res = NextResponse.redirect(baseUrl);

    const isHttps = protocol === 'https';

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return res;
  } catch (err: unknown) {
    console.error('BFF Session error:', err);
    
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const cleanHost = host.includes('devtunnels.ms') ? host.replace(':3000', '') : host;
    const fallbackUrl = `${protocol}://${cleanHost}/`;
    
    return NextResponse.redirect(fallbackUrl);
  }
}
