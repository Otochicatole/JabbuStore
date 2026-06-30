import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import type { StoreItem } from "@/features/admin/domain/types";

import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  const adminUser = await requireAdmin(language);
  const initialItems: StoreItem[] = [];

  return <AdminDashboardClient initialItems={initialItems} adminUser={adminUser} />;
}
