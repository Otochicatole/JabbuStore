import { AdminBotsPanel } from "@/features/admin/ui/AdminBotsPanel";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";

export default async function AdminBotsPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <div className="p-4 md:p-8">
      <AdminBotsPanel />
    </div>
  );
}
