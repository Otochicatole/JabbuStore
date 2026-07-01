import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { QuotesPage } from "@/features/admin/ui/AdminPanel/QuotesPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminQuotesPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <QuotesPage />
    </AdminPage>
  );
}
