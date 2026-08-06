import type { Metadata } from "next";
import { buildPageMetadata } from "@/shared/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin Login - JabbuStore",
  description: "Secure admin login for JabbuStore control panel.",
  lang: "en",
  path: "/admin/login",
  keywords: [],
  noIndex: true,
});

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
