import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

const metaByLang = {
  en: {
    title: "Global CS2 Skin Market - JabbuStore",
    description: "Access the complete catalog from the external market. Browse thousands of CS2 skins on request from YouPin with competitive prices.",
    keywords: ["CS2 market", "skin market", "CS2 catalog", "YouPin skins", "global market skins", "CS2 items"],
  },
  es: {
    title: "Mercado Global de Skins CS2 - JabbuStore",
    description: "Accede al catálogo completo del mercado externo. Explora miles de skins de CS2 bajo pedido de YouPin con precios competitivos.",
    keywords: ["mercado CS2", "catálogo skins", "YouPin skins", "mercado global skins", "items CS2"],
  },
  br: {
    title: "Mercado Global de Skins CS2 - JabbuStore",
    description: "Acesse o catálogo completo do mercado externo. Explore milhares de skins de CS2 sob encomenda da YouPin com preços competitivos.",
    keywords: ["mercado CS2", "catálogo skins", "YouPin skins", "mercado global skins", "itens CS2"],
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
    path: `/${language}/market`,
    keywords: meta.keywords,
    ogType: "website",
  });
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
