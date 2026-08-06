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
    en: `Raffle: ${cleanId} - JabbuStore`,
    es: `Sorteo: ${cleanId} - JabbuStore`,
    br: `Sorteio: ${cleanId} - JabbuStore`,
  };

  const descriptions: Record<string, string> = {
    en: `View details and participate in the CS2 skin raffle for ${cleanId}. Buy tickets and win exclusive items on JabbuStore.`,
    es: `Consulta los detalles y participa en el sorteo de skins CS2 de ${cleanId}. Compra tickets y gana items exclusivos en JabbuStore.`,
    br: `Veja os detalhes e participe do sorteio de skins CS2 de ${cleanId}. Compre bilhetes e ganhe itens exclusivos na JabbuStore.`,
  };

  return buildPageMetadata({
    title: titles[language] ?? titles.en,
    description: descriptions[language] ?? descriptions.en,
    lang: language,
    path: `/${language}/raffles/${id}`,
    keywords: ["CS2 raffle", "skin raffle", `raffle ${cleanId}`, "win skins"],
    ogType: "website",
  });
}

export default function RaffleDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
