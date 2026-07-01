import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { MarketCatalog } from "@/features/market/ui/MarketCatalog";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function AdminMarketPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <MarketCatalog />
    </AdminPage>
  );
}
