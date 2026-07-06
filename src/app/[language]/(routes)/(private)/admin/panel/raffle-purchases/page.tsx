import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { RafflePurchasesListPage } from "@/features/admin/raffles/ui/RafflePurchasesPage/RafflePurchasesListPage";
import { AdminPage, AdminLoadingState } from "@/features/admin/ui/AdminShell";

export default async function AdminRafflePurchasesPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <Suspense fallback={<AdminLoadingState />}>
        <RafflePurchasesListPage />
      </Suspense>
    </AdminPage>
  );
}
