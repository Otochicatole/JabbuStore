import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { PurchasesPage } from "@/features/admin/orders/ui/PurchasesPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminPurchasesPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <PurchasesPage />
    </AdminPage>
  );
}
