import { redirect } from "next/navigation";

const TAB_ROUTES: Record<string, string> = {
  inventory: "inventory",
  market: "market",
  purchases: "purchases",
  listings: "listings",
  quotes: "quotes",
  tickets: "tickets",
  bots: "bots",
  settings: "settings",
};

export default async function AdminLegacyPanelRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { language } = await params;
  const { tab } = await searchParams;
  const route = tab ? TAB_ROUTES[tab] : null;

  redirect(`/${language}/admin/panel/${route || "inventory"}`);
}
