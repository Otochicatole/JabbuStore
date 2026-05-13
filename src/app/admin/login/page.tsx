import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (token) {
    // Si ya existe la cookie con el JWT, redirigimos al dashboard directamente en el servidor sin destello de cliente
    redirect('/admin/panel/dashboard');
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0814] px-4">
      {/* Background radial ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/[0.02] blur-[100px] rounded-full pointer-events-none" />

      <LoginForm />
    </div>
  );
}
