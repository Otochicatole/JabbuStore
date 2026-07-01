import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { AdminPage } from "@/features/admin/ui/AdminShell";
import { BotsPage } from "@/features/admin/bots/ui/BotsPage";

export default async function AdminBotsPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <BotsPage />
    </AdminPage>
  );
}
