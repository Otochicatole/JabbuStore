import { redirect } from "next/navigation";

export default async function AdminPanelPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  redirect(`/${language}/admin/panel/inventory`);
}
