/**
 * Builds a YouPin898 URL for a specific listing.
 * SteamWebAPI float/assets exposes the marketplace id as `marketid` / `link`;
 * on YouPin it maps to https://www.youpin898.com/goodDetail?id={id}
 */
export function buildYoupinItemUrl(options: {
  externalId?: string | null;
  name?: string;
}): string {
  if (options.externalId) {
    return `https://www.youpin898.com/goodDetail?id=${encodeURIComponent(options.externalId)}`;
  }

  const keywords = getCleanSearchName(options.name || "");
  return `https://www.youpin898.com/goodList?gameId=730&keywords=${encodeURIComponent(keywords)}`;
}

export function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;

  const phases = [
    " | Phase 1",
    " | Phase 2",
    " | Phase 3",
    " | Phase 4",
    " | Ruby",
    " | Sapphire",
    " | Black Pearl",
    " | Emerald",
  ];
  phases.forEach((p) => {
    name = name.replace(p, "");
  });

  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
    " | Factory New",
    " | Minimal Wear",
    " | Field-Tested",
    " | Well-Worn",
    " | Battle-Scarred",
    " Factory New",
    " Minimal Wear",
    " Field-Tested",
    " Well-Worn",
    " Battle-Scarred",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });

  name = name.replace("★ ", "");
  name = name.replace("★", "");

  return name.trim();
}
