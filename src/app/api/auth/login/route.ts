import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/shared/lib/api';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const response = await fetch(`${BACKEND_URL}/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tunnel-Skip-AntiPhishing-Page': 'true',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Credenciales inválidas' },
        { status: response.status }
      );
    }

    const res = NextResponse.json({ admin: data.admin });

    // Establecer la cookie de sesión de forma segura sobre el dominio del frontend (localhost)
    res.cookies.set('admin_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('BFF Login error:', err);
    return NextResponse.json(
      { error: 'Error interno en el servidor del frontend' },
      { status: 500 }
    );
  }
}
