import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

const metaByLang = {
  en: {
    title: "Buy CS2 Skins - JabbuStore",
    description: "Browse verified CS2 skins and complete your purchase securely. Instant delivery from our bots with the best prices.",
    keywords: ["buy CS2 skins", "CS2 skins for sale", "buy skins CS2", "CS2 marketplace", "instant delivery skins"],
  },
  es: {
    title: "Comprar Skins de CS2 - JabbuStore",
    description: "Explora skins verificadas de CS2 y completa tu compra de forma segura. Entrega instantánea desde nuestros bots con los mejores precios.",
    keywords: ["comprar skins CS2", "skins CS2 venta", "mercado skins CS2", "entrega instantánea skins"],
  },
  br: {
    title: "Comprar Skins de CS2 - JabbuStore",
    description: "Explore skins verificadas de CS2 e conclua sua compra de forma segura. Entrega instantânea dos nossos bots com os melhores preços.",
    keywords: ["comprar skins CS2", "skins CS2 venda", "mercado skins CS2", "entrega instantânea skins"],
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
    path: `/${language}/buy`,
    keywords: meta.keywords,
    ogType: "website",
  });
}

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
