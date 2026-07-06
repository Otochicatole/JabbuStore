import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { AdminPage } from "@/features/admin/ui/AdminShell";
import { OrderOperationPage } from "@/features/admin/orders/ui/OrderOperationPage";

export default async function AdminOrderOperationRoute({
  params,
}: {
  params: Promise<{ language: string; kind: string }>;
}) {
  const { language, kind } = await params;
  await requireAdmin(language);

  if (kind !== "purchase" && kind !== "listing") {
    notFound();
  }

  return (
    <AdminPage>
      <OrderOperationPage kind={kind} />
    </AdminPage>
  );
}
