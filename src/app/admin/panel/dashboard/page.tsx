import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BACKEND_URL } from '@/shared/lib/api';
import { StoreItem } from '@/features/admin/domain/types';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    // Si no hay cookie de sesión JWT, redirigimos al login en el servidor inmediatamente
    redirect('/admin/login');
  }

  let adminUser = null;
  const initialItems: StoreItem[] = [];

  try {
    // Validar el token JWT de la cookie con el endpoint seguro del backend
    const meResponse = await fetch(`${BACKEND_URL}/admins/me`, {
      headers: {
        'Cookie': `admin_token=${token}`,
        'X-Tunnel-Skip-AntiPhishing-Page': 'true',
      },
      next: { revalidate: 0 } // Asegurar validación fresca
    });

    if (!meResponse.ok) {
      redirect('/admin/login');
    }

    const meData = await meResponse.json();
    adminUser = meData.admin;
  } catch (err) {
    console.error('Error al validar la sesión del administrador en el servidor:', err);
    redirect('/admin/login');
  }

  if (!adminUser) {
    redirect('/admin/login');
  }

  // Renderizar la interfaz del dashboard pasándole la data del admin y el catálogo inicial (vacío para carga en cliente)
  return <AdminDashboardClient initialItems={initialItems} adminUser={adminUser} />;
}
