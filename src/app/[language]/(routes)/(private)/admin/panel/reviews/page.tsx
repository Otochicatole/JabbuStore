import { requireAdmin } from "@/features/admin/auth/requireAdmin";
import { AdminReviewsPage } from "@/features/admin/reviews/ui/AdminReviewsPage";
import { AdminPage } from "@/features/admin/ui/AdminShell";

export default async function ReviewsAdminPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  await requireAdmin(language);

  return (
    <AdminPage>
      <AdminReviewsPage />
    </AdminPage>
  );
}
