import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { ListingsPage } from "@/features/admin/orders/ui/ListingsPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminListingsPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <ListingsPage />
    </AdminPage>
  );
}
