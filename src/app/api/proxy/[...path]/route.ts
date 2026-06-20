import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// El proxy del servidor se conecta directamente al backend por localhost
// para evitar la página anti-phishing del dev tunnel de VS Code.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001/api';

// URL pública del backend (la del túnel) para detectar redirects internos del backend
const BACKEND_PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cabeceras HTTP/1.1 prohibidas en HTTP/2 y cabeceras de conexión que no deben reenviarse
const HOP_BY_HOP_HEADERS = [
  'host',
  'connection',
  'proxy-connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
];

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');

  if (path === 'debug') {
    // Avoid synchronous filesystem writes in the request path. They can stall
    // every proxied request when checkout emits several diagnostics at once.
    return NextResponse.json({ ok: true });
  }

  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : '';

  const targetUrl = `${BACKEND_INTERNAL_URL}/${path}${query}`;

  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  const adminToken = cookieStore.get('admin_token')?.value;

  const headers = new Headers(req.headers);
  headers.set('X-Tunnel-Skip-AntiPhishing-Page', 'true');

  // Eliminar cabeceras problemáticas
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  // Inyectar cookies de autenticación manualmente
  const cookieArray: string[] = [];
  if (authToken) cookieArray.push(`auth_token=${authToken}`);
  if (adminToken) cookieArray.push(`admin_token=${adminToken}`);

  if (cookieArray.length > 0) {
    headers.set('Cookie', cookieArray.join('; '));
  } else {
    headers.delete('cookie');
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    // manual para poder inspeccionar los redirects y decidir qué hacer con ellos
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Manejo inteligente de redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');

      if (location) {
        // Detectar si el redirect es hacia el propio backend (localhost o túnel público)
        const backendInternalBase = BACKEND_INTERNAL_URL.replace('/api', '');
        const backendPublicBase = BACKEND_PUBLIC_URL.replace('/api', '');

        const isBackendRedirect =
          location.startsWith(backendInternalBase) ||
          location.startsWith(backendPublicBase) ||
          location.startsWith('/api/');

        if (isBackendRedirect) {
          // Reescribir la URL del backend al proxy interno para seguirla
          const rewrittenLocation = location
            .replace(backendPublicBase + '/api', '/api/proxy')
            .replace(backendInternalBase + '/api', '/api/proxy');
          return NextResponse.redirect(new URL(rewrittenLocation, req.url), response.status);
        } else {
          // Redirect externo (Steam, etc.): redirigir el browser directamente
          return NextResponse.redirect(location, response.status);
        }
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'No se pudo conectar con el backend. Asegúrate de que está corriendo en ' + BACKEND_INTERNAL_URL },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
