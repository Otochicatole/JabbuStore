import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://9q88kt3s-3001.brs.devtunnels.ms/api';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : '';
  
  const targetUrl = `${BACKEND_BASE_URL}/${path}${query}`;

  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  const adminToken = cookieStore.get('admin_token')?.value;

  const headers = new Headers(req.headers);
  headers.set('X-Tunnel-Skip-AntiPhishing-Page', 'true');
  
  // No enviar la cabecera host original
  headers.delete('host');
  headers.delete('connection');

  // Inyectar manualmente las cookies para que el backend las reciba
  const cookieArray = [];
  if (authToken) cookieArray.push(`auth_token=${authToken}`);
  if (adminToken) cookieArray.push(`admin_token=${adminToken}`);
  
  if (cookieArray.length > 0) {
    headers.set('Cookie', cookieArray.join('; '));
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Reconstruir la respuesta
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Custom Proxy Error:', error);
    return new NextResponse('Internal Server Error in Proxy', { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
