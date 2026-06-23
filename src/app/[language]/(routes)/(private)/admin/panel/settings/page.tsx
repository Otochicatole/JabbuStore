import { AdminSettings } from "@/features/admin/ui/AdminSettings";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return <AdminSettings />;
}
