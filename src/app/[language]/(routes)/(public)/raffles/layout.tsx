import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

const metaByLang = {
  en: {
    title: "CS2 Skin Raffles - JabbuStore",
    description: "Participate in CS2 skin raffles and win exclusive items. Buy tickets for a chance to win legendary knives, gloves, and rare skins.",
    keywords: ["CS2 raffle", "skin raffle", "CS2 giveaway", "win CS2 skins", "skin lottery", "CS2 prizes"],
  },
  es: {
    title: "Sorteos de Skins CS2 - JabbuStore",
    description: "Participa en sorteos de skins de CS2 y gana items exclusivos. Compra tickets para tener la oportunidad de ganar cuchillos legendarios, guantes y skins raras.",
    keywords: ["sorteo CS2", "rifa skins", "ganar skins CS2", "lotería skins", "premios CS2"],
  },
  br: {
    title: "Sorteios de Skins CS2 - JabbuStore",
    description: "Participe de sorteios de skins de CS2 e ganhe itens exclusivos. Compre bilhetes para ter a chance de ganhar facas lendárias, luvas e skins raras.",
    keywords: ["sorteio CS2", "rifa skins", "ganhar skins CS2", "loteria skins", "prêmios CS2"],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const { language } = await params;
  if (!isLocale(language)) return {};

  const meta = metaByLang[language] ?? metaByLang.en;
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    lang: language,
    path: `/${language}/raffles`,
    keywords: meta.keywords,
    ogType: "website",
  });
}

export default function RafflesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
