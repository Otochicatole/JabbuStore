import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { RaffleOrdersPage } from "@/features/admin/raffles/ui/RafflePurchasesPage/RaffleOrdersPage";
import { AdminPage, AdminLoadingState } from "@/features/admin/ui/AdminShell";

export default async function AdminRaffleOrdersRoute({
  params,
}: {
  params: Promise<{ language: string; raffleId: string }>;
}) {
  const { language, raffleId } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <Suspense fallback={<AdminLoadingState />}>
        <RaffleOrdersPage raffleId={raffleId} />
      </Suspense>
    </AdminPage>
  );
}
