import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BACKEND_URL } from "@/shared/lib/api";

export async function requireAdmin(language: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const loginPath = `/${language}/admin/login`;
  const clearSessionPath = `/api/auth/logout?next=${encodeURIComponent(loginPath)}`;

  if (!token) {
    redirect(loginPath);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/admins/me`, {
      headers: {
        Cookie: `admin_token=${token}`,
        "X-Tunnel-Skip-AntiPhishing-Page": "true",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      redirect(clearSessionPath);
    }

    const data = await response.json();
    if (!data.admin) {
      redirect(clearSessionPath);
    }

    return data.admin;
  } catch (err) {
    console.error("Error validating admin session:", err);
    redirect(clearSessionPath);
  }
}
