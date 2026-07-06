import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { RaffleOrderDetailPage } from "@/features/admin/raffles/ui/RafflePurchasesPage/RaffleOrderDetailPage";
import { AdminPage, AdminLoadingState } from "@/features/admin/ui/AdminShell";

export default async function AdminRaffleOrderDetailRoute({
  params,
}: {
  params: Promise<{ language: string; raffleId: string; orderId: string }>;
}) {
  const { language, raffleId, orderId } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <Suspense fallback={<AdminLoadingState />}>
        <RaffleOrderDetailPage raffleId={raffleId} orderId={orderId} />
      </Suspense>
    </AdminPage>
  );
}
