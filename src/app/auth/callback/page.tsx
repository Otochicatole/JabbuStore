'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Guardar el token en la cookie HTTP-Only a través del BFF local
      fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      }).then(() => {
        window.location.href = '/';
      }).catch((err) => {
        console.error('Error saving session:', err);
        window.location.href = '/';
      });
    } else {
      // Si no hay token, redirigir al login o mostrar error
      console.error('No token found in callback');
      window.location.href = '/';
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-lg font-medium animate-pulse text-muted">
          Verificando credenciales de Steam...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
