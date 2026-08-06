import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout", "/profile", "/inventory", "/purchases", "/listings", "/quotes", "/tickets"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
