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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { language } = await params;
  const { tab, ...rest } = await searchParams;
  const tabValue = Array.isArray(tab) ? tab[0] : tab;
  const route = tabValue ? TAB_ROUTES[tabValue] : null;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    }
  }

  const queryString = query.toString();
  redirect(`/${language}/admin/panel/${route || "inventory"}${queryString ? `?${queryString}` : ""}`);
}
