import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { AdminPage } from "@/features/admin/ui/AdminShell";
import { MarketPage } from "@/features/admin/market/ui/MarketPage";

export default async function AdminMarketPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <MarketPage />
    </AdminPage>
  );
}
