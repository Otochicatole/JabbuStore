import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JabbuStore - CS2 Skin Trading",
    short_name: "JabbuStore",
    description: "Trade your CS2 skins quickly and securely with JabbuStore. Instant skin marketplace.",
    start_url: "/en",
    display: "standalone",
    background_color: "#030108",
    theme_color: "#d946ef",
    orientation: "any",
    icons: [
      {
        src: "/logo.webp",
        sizes: "512x512",
        type: "image/webp",
      },
      {
        src: "/icon.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
