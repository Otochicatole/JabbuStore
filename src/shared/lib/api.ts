/**
 * Ejemplo de cómo realizar una petición protegida usando el token de Steam
 * guardado en localStorage.
 */

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Obtener el token de localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    'X-Tunnel-Skip-AntiPhishing-Page': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Manejar token expirado o inválido
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/'; // O redirigir a login
    }
  }

  return response;
}

// Ejemplo de uso:
/*
const getUserProfile = async () => {
  const res = await fetchWithAuth('https://9q88kt3s-3001.brs.devtunnels.ms/api/users/profile');
  const data = await res.json();
  return data;
}
*/
