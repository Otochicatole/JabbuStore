import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string; id: string }>;
}): Promise<Metadata> {
  const { language, id } = await params;
  if (!isLocale(language)) return {};

  const cleanId = id.replace(/-/g, " ");

  const titles: Record<string, string> = {
    en: `Live Raffle: ${cleanId} - JabbuStore`,
    es: `Sorteo en Vivo: ${cleanId} - JabbuStore`,
    br: `Sorteio ao Vivo: ${cleanId} - JabbuStore`,
  };

  const descriptions: Record<string, string> = {
    en: `Watch the live CS2 skin raffle draw for ${cleanId} on JabbuStore. Real-time results and winner announcements.`,
    es: `Mira el sorteo en vivo de skins CS2 para ${cleanId} en JabbuStore. Resultados en tiempo real y anuncio de ganadores.`,
    br: `Assista ao sorteio ao vivo de skins CS2 para ${cleanId} na JabbuStore. Resultados em tempo real e anúncio dos vencedores.`,
  };

  return buildPageMetadata({
    title: titles[language] ?? titles.en,
    description: descriptions[language] ?? descriptions.en,
    lang: language,
    path: `/${language}/raffles/${id}/live`,
    keywords: ["CS2 raffle live", "live raffle", "skin raffle draw", "real-time results"],
    ogType: "website",
    noIndex: true,
  });
}

export default function RaffleLiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
