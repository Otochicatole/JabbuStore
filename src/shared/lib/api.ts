/**
 * Ejemplo de cómo realizar una petición protegida usando el token de Steam
 * guardado en localStorage.
 */

export const BACKEND_URL =
  typeof window !== 'undefined'
    ? '/api/proxy'
    : process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Tunnel-Skip-AntiPhishing-Page': 'true',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Transmite de forma automática la cookie HTTP-Only al proxy
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      fetch('/api/auth/user-logout', { method: 'POST' }).catch(() => { });
    }
  }

  return response;
}

// Ejemplo de uso:
/*
const getUserProfile = async () => {
  const res = await fetchWithAuth(`${BACKEND_URL}/users/profile`);
  const data = await res.json();
  return data;
}
*/
