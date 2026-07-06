import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import type { StoreItem } from "@/features/admin/domain/types";
import { InventoryPage } from "@/features/admin/inventory/ui/InventoryPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);
  const initialItems: StoreItem[] = [];

  return (
    <AdminPage>
      <InventoryPage initialItems={initialItems} />
    </AdminPage>
  );
}
