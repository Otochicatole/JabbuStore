import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { AdminTicketsPage } from "@/features/tickets/ui/AdminTicketsPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminTicketsRoute({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <AdminTicketsPage />
    </AdminPage>
  );
}
