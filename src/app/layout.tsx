import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainLayout } from "@/shared/components/MainLayout";
import { JsonLdOrganization, JsonLdWebSite } from "@/shared/components/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030108" },
    { media: "(prefers-color-scheme: light)", color: "#d946ef" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    template: "%s | JabbuStore",
    default: "JabbuStore - The Future of CS2 Skin Trading",
  },
  description:
    "Trade your CS2 skins quickly and securely with JabbuStore. Instant skin marketplace with the best prices, live market updates, and secure transactions.",
  keywords: [
    "CS2 skins",
    "CS2 skin trading",
    "Counter-Strike 2 skins",
    "buy CS2 skins",
    "sell CS2 skins",
    "skin marketplace",
    "CS2 market",
    "Steam skins",
    "CS2 trading",
    "JabbuStore",
  ],
  authors: [{ name: "JabbuStore" }],
  creator: "JabbuStore",
  publisher: "JabbuStore",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com"
  ),
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      es: "/es",
      br: "/br",
    },
  },
  openGraph: {
    type: "website",
    siteName: "JabbuStore",
    locale: "en_US",
    title: "JabbuStore - The Future of CS2 Skin Trading",
    description:
      "Trade your CS2 skins quickly and securely with JabbuStore. Instant skin marketplace.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://jabbustore.com",
    images: [
      {
        url: "/logo.webp",
        width: 512,
        height: 512,
        alt: "JabbuStore Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JabbuStore - CS2 Skin Trading",
    description:
      "Trade your CS2 skins quickly and securely with JabbuStore. Instant skin marketplace.",
    images: ["/logo.webp"],
    creator: "@jabbustore",
    site: "@jabbustore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
  manifest: "/manifest.webmanifest",
  category: "gaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLdOrganization />
        <JsonLdWebSite />
      </head>
      <body className="min-h-full flex flex-col bg-background">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
