import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth/requireAdmin";

export default async function AdminRaffleOrdersRedirect({
  params,
}: {
  params: Promise<{ language: string; raffleId: string }>;
}) {
  const { language, raffleId } = await params;
  await requireAdmin(language);

  redirect(`/${language}/admin/panel/raffle-purchases?raffle=${raffleId}`);
}
