import type { MetadataRoute } from "next";
import { LOCALES } from "@/shared/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com";

const PUBLIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/buy", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/market", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/sell", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/raffles", priority: 0.8, changeFrequency: "daily" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const { path, priority, changeFrequency } of PUBLIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l,
              `${SITE_URL}/${l}${path}`,
            ])
          ),
        },
      });
    }
  }

  return entries;
}
