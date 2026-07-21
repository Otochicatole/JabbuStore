import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/shared/lib/api';

type LoginResponse = {
  admin?: unknown;
  token?: unknown;
  error?: unknown;
  message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLoginResponse(body: string): LoginResponse | null {
  if (!body.trim()) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(body);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'La solicitud de inicio de sesión no es válida' },
      { status: 400 }
    );
  }

  if (
    !isRecord(requestBody) ||
    typeof requestBody.email !== 'string' ||
    !requestBody.email.trim() ||
    typeof requestBody.password !== 'string' ||
    !requestBody.password
  ) {
    return NextResponse.json(
      { error: 'Email y contraseña son obligatorios' },
      { status: 400 }
    );
  }

  try {
    const backendUrl = BACKEND_URL.replace(/\/$/, '');

    const response = await fetch(`${backendUrl}/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tunnel-Skip-AntiPhishing-Page': 'true',
      },
      body: JSON.stringify({
        email: requestBody.email.trim(),
        password: requestBody.password,
      }),
      cache: 'no-store',
      redirect: 'manual',
    });

    const responseBody = await response.text();
    const data = parseLoginResponse(responseBody);

    if (response.status >= 300 && response.status < 400) {
      console.error(
        `BFF Login upstream redirected the request (HTTP ${response.status})`
      );
      return NextResponse.json(
        { error: 'El servidor de autenticación respondió con una redirección inesperada' },
        { status: 502 }
      );
    }

    if (!data) {
      console.error(
        `BFF Login upstream returned an invalid body (HTTP ${response.status})`
      );
      return NextResponse.json(
        { error: 'El servidor de autenticación devolvió una respuesta inválida' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const upstreamError =
        typeof data.error === 'string' && data.error.trim()
          ? data.error
          : typeof data.message === 'string' && data.message.trim()
            ? data.message
            : response.status === 401
              ? 'Credenciales inválidas'
              : `El servidor de autenticación rechazó la solicitud (HTTP ${response.status})`;

      return NextResponse.json(
        { error: upstreamError },
        { status: response.status }
      );
    }

    if (
      !isRecord(data.admin) ||
      typeof data.token !== 'string' ||
      !data.token.trim()
    ) {
      console.error('BFF Login upstream returned an incomplete success response');
      return NextResponse.json(
        { error: 'El servidor de autenticación devolvió una respuesta incompleta' },
        { status: 502 }
      );
    }

    const res = NextResponse.json({ admin: data.admin });
    const requestUrl = new URL(request.url);
    const protocol =
      request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      requestUrl.protocol.replace(':', '');
    const isHttps = protocol === 'https';

    res.cookies.set('admin_token', data.token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/',
    });

    return res;
  } catch (err: unknown) {
    console.error('BFF Login error:', err);
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor de autenticación' },
      { status: 502 }
    );
  }
}
