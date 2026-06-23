import { notFound } from "next/navigation";

import { isLocale } from "@/shared/i18n/routing";

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
