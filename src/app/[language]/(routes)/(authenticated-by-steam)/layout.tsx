import type { Metadata } from "next";
import { isLocale } from "@/shared/i18n/routing";
import { buildPageMetadata } from "@/shared/lib/seo";

const metaByLang = {
  en: {
    title: "Profile - JabbuStore",
    description: "Manage your JabbuStore account, Steam trade URL, and personal data.",
  },
  es: {
    title: "Perfil - JabbuStore",
    description: "Gestiona tu cuenta de JabbuStore, trade URL de Steam y datos personales.",
  },
  br: {
    title: "Perfil - JabbuStore",
    description: "Gerencie sua conta JabbuStore, trade URL da Steam e dados pessoais.",
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
    path: `/${language}/profile`,
    keywords: [],
    noIndex: true,
  });
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
