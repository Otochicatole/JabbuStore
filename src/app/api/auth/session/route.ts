import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('BFF Session error:', err);
    return NextResponse.json(
      { error: 'Error interno al guardar sesión' },
      { status: 500 }
    );
  }
}
