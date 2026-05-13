import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const originalUrl = new URL(request.url);
    const token = originalUrl.searchParams.get('token');

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    // Forzar la limpieza del puerto 3000 si estamos en un devtunnel
    const cleanHost = host.includes('devtunnels.ms') ? host.replace(':3000', '') : host;
    const baseUrl = `${protocol}://${cleanHost}/`;

    if (!token) {
      return NextResponse.redirect(baseUrl);
    }

    // Redirigir al inicio después de setear la cookie
    const res = NextResponse.redirect(baseUrl);

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('BFF Session error:', err);
    
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const cleanHost = host.includes('devtunnels.ms') ? host.replace(':3000', '') : host;
    const fallbackUrl = `${protocol}://${cleanHost}/`;
    
    return NextResponse.redirect(fallbackUrl);
  }
}
