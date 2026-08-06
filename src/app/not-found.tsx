import type { Metadata } from "next";
import { getBaseUrl } from "@/shared/lib/seo";

export const metadata: Metadata = {
  title: "404 - Page Not Found | JabbuStore",
  description: "The page you are looking for does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-[#030108] text-white min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">
            404
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-white/60 font-medium">
            Page not found
          </p>
          <p className="mt-2 text-sm text-white/40">
            The page you are looking for does not exist or has been moved.
          </p>
          <a
            href={getBaseUrl()}
            className="mt-8 inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-accent/30 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </body>
    </html>
  );
}
