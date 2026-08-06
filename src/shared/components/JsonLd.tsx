import { getSiteName } from "@/shared/lib/seo";

export function JsonLdOrganization() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: getSiteName(),
    url: siteUrl,
    logo: `${siteUrl}/logo.webp`,
    description:
      "Trade your CS2 skins quickly and securely with JabbuStore. Instant skin marketplace with the best prices, live market updates, and secure transactions.",
    sameAs: [
      "https://twitter.com/jabbustore",
      "https://discord.gg/jabbustore",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Spanish", "Portuguese"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function JsonLdBreadcrumb({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function JsonLdWebSite() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteName(),
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/en/buy?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
