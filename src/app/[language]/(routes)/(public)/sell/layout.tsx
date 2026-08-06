import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

const metaByLang = {
  en: {
    title: "Sell CS2 Skins - JabbuStore",
    description: "Turn your CS2 skins into real money. Direct and instant payments to your preferred account. Secure, fast, and no hidden fees.",
    keywords: ["sell CS2 skins", "cash out CS2 skins", "sell skins for money", "CS2 cashout", "instant payment skins"],
  },
  es: {
    title: "Vender Skins de CS2 - JabbuStore",
    description: "Convierte tus skins de CS2 en dinero real. Pagos directos e instantáneos a tu cuenta favorita. Sin tarifas ocultas.",
    keywords: ["vender skins CS2", "retirar dinero skins", "cashout CS2", "pago instantáneo skins"],
  },
  br: {
    title: "Vender Skins de CS2 - JabbuStore",
    description: "Converta suas skins de CS2 em dinheiro real. Pagamentos diretos e instantâneos na sua conta favorita. Sem taxas ocultas.",
    keywords: ["vender skins CS2", "sacar dinheiro skins", "cashout CS2", "pagamento instantâneo skins"],
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
    path: `/${language}/sell`,
    keywords: meta.keywords,
    ogType: "website",
  });
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
