import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { en } from "@/shared/i18n/dictionaries/en";
import { es } from "@/shared/i18n/dictionaries/es";
import { br } from "@/shared/i18n/dictionaries/br";
import { buildPageMetadata } from "@/shared/lib/seo";

const dictionaries = { en, es, br } as const;

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language } = await params;
  if (!isLocale(language)) {
    return {};
  }

  const dict = dictionaries[language];
  return buildPageMetadata({
    title: dict["home.meta.title"],
    description: dict["home.meta.description"],
    lang: language,
    path: `/${language}`,
    keywords: [
      "CS2 skins",
      "skin trading",
      "buy skins",
      "sell skins",
      "CS2 market",
      language === "es" ? "intercambiar skins" : language === "br" ? "trocar skins" : "trade skins",
    ],
  });
}

export default async function LanguageLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}>) {
  const { language } = await params;
  if (!isLocale(language)) {
    notFound();
  }

  return children;
}
