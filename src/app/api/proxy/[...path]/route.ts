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

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function splitConfig(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getForwardedHost(req: NextRequest) {
  return req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
}

function getForwardedProtocol(req: NextRequest, requestUrl: URL) {
  return req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || requestUrl.protocol.replace(':', '');
}

function getHostFromHeader(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function getHostFromUrlOrHost(value: string | null) {
  if (!value) return null;
  return getHostFromHeader(value) || value.trim().toLowerCase();
}

function configuredFrontendHosts() {
  const hosts = splitConfig(process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL)
    .map(getHostFromUrlOrHost)
    .filter((value): value is string => Boolean(value));
  const backendPublicHost = getHostFromHeader(BACKEND_PUBLIC_URL);
  if (backendPublicHost?.endsWith('.devtunnels.ms')) {
    hosts.push(backendPublicHost.replace('-3001.', '-3000.'));
  }
  if (process.env.NODE_ENV !== 'production') {
    hosts.push('localhost:3000', '127.0.0.1:3000');
  }
  return hosts;
}

function isAllowedMutationOrigin(req: NextRequest, requestUrl: URL) {
  if (!UNSAFE_METHODS.has(req.method.toUpperCase())) {
    return true;
  }

  const forwardedHost = getForwardedHost(req);
  const host = forwardedHost || req.headers.get('host');
  const protocol = getForwardedProtocol(req, requestUrl);
  const forwardedOrigin = host ? `${protocol}://${host}` : requestUrl.origin;
  const allowedHosts = new Set(
    [
      requestUrl.host,
      host,
      forwardedHost,
      getHostFromHeader(forwardedOrigin),
      ...configuredFrontendHosts(),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase()),
  );

  const originHost = getHostFromHeader(req.headers.get('origin'));
  const refererHost = getHostFromHeader(req.headers.get('referer'));
  const requestHost = originHost || refererHost;

  return Boolean(requestHost && allowedHosts.has(requestHost));
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');

  if (path === 'debug') {
    // Avoid synchronous filesystem writes in the request path. They can stall
    // every proxied request when checkout emits several diagnostics at once.
    return NextResponse.json({ ok: true });
  }

  const url = new URL(req.url);
  if (!isAllowedMutationOrigin(req, url)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

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
