import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com";
const SITE_NAME = "JabbuStore";
const OG_IMAGE = `${SITE_URL}/logo.webp`;
const TWITTER_HANDLE = "@jabbustore";

export function getBaseUrl() {
  return SITE_URL;
}

export function getSiteName() {
  return SITE_NAME;
}

export function generateCanonicalUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function generateHreflangAlternates(path: string, currentLang: string): Metadata["alternates"] {
  const cleanPath = path.replace(/^\/(en|es|br)/, "");
  const normalizedPath = cleanPath || "/";

  return {
    canonical: `${SITE_URL}/${currentLang}${normalizedPath === "/" ? "" : normalizedPath}`,
    languages: {
      en: `${SITE_URL}/en${normalizedPath === "/" ? "" : normalizedPath}`,
      es: `${SITE_URL}/es${normalizedPath === "/" ? "" : normalizedPath}`,
      br: `${SITE_URL}/br${normalizedPath === "/" ? "" : normalizedPath}`,
    },
  };
}

export function generateOpenGraphMetadata({
  locale,
  siteName = SITE_NAME,
  type = "website",
}: {
  locale: string;
  siteName?: string;
  type?: "website" | "article";
} = { locale: "en" }): Metadata["openGraph"] {
  return {
    type,
    siteName,
    locale: locale === "es" ? "es_AR" : locale === "br" ? "pt_BR" : "en_US",
  };
}

export function generateTwitterMetadata(): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  };
}

export function buildPageMetadata({
  title,
  description,
  lang,
  path,
  image,
  ogType,
  noIndex = false,
  keywords,
}: {
  title: string;
  description: string;
  lang: string;
  path: string;
  image?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const ogTitle = title;
  const ogDescription = description;
  const ogImage = image || OG_IMAGE;

  const metadata: Metadata = {
    title: ogTitle,
    description: ogDescription,
    keywords: keywords,
    alternates: generateHreflangAlternates(path, lang),
    openGraph: {
      ...generateOpenGraphMetadata({ locale: lang, type: ogType }),
      title: ogTitle,
      description: ogDescription,
      url: generateCanonicalUrl(path),
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      ...generateTwitterMetadata(),
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };

  return metadata;
}
