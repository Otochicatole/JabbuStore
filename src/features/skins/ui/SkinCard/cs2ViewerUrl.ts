import type { Locale } from "@/shared/i18n/types";
import type { Skin } from "../../domain/skin";

export const CS2_VIEWER_ORIGIN = "https://3d.cs2screen.com";

const SUPPORTED_VIEWER_NON_3D_TYPES = new Set([
  "container",
  "sticker",
  "patch",
  "graffiti",
  "music_kit",
  "collectible",
  "pass",
  "key",
  "gift",
  "tool",
  "tag",
]);

export function getCs2ViewerPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_CS2_3D_VIEWER_KEY?.trim();
  return key ? key : null;
}

export function mapLocaleToViewerLang(locale: Locale | string | undefined): string {
  if (locale === "br") return "pt";
  return "en";
}

export function isValidSteamInspectLink(link: string | null | undefined): link is string {
  if (!link) return false;
  const trimmed = link.trim();
  return trimmed.startsWith("steam://") && !/%[a-z0-9_:]+%/i.test(trimmed);
}

export function supportsCs2Viewer3d(skin: Skin, inspectLink?: string | null): boolean {
  if (isValidSteamInspectLink(inspectLink ?? skin.inspectLink)) {
    return true;
  }
  if (skin.catalogItemType && SUPPORTED_VIEWER_NON_3D_TYPES.has(skin.catalogItemType)) {
    return false;
  }
  return Boolean(skin.weapon?.trim() && skin.name?.trim());
}

export function normalizePresetWeapon(weapon: string): string {
  return weapon
    .replace(/★\s*/g, "")
    .replace(/StatTrak™?\s*/gi, "")
    .replace(/Souvenir\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface BuildCs2ViewerUrlParams {
  viewerKey: string | null | undefined;
  skin: Skin;
  inspectLink?: string | null;
  wearFloat?: number;
  locale?: Locale | string;
}

/**
 * Builds the official SteamWebAPI / cs2screen iframe URL for an item.
 * Uses the real Steam inspect link when available, or weapon/paint/wear presets as fallback.
 */
export function buildCs2ViewerUrl({
  viewerKey,
  skin,
  inspectLink,
  wearFloat,
  locale,
}: BuildCs2ViewerUrlParams): string | null {
  const cleanKey = viewerKey?.trim();
  if (!cleanKey) return null;

  const url = new URL(`${CS2_VIEWER_ORIGIN}/`);
  url.searchParams.set("key", cleanKey);
  url.searchParams.set("embed", "1");
  url.searchParams.set("lang", mapLocaleToViewerLang(locale));

  const effectiveInspectLink = inspectLink ?? skin.inspectLink;
  if (isValidSteamInspectLink(effectiveInspectLink)) {
    url.searchParams.set("inspectlink", effectiveInspectLink.trim());
    return url.href;
  }

  const cleanWeapon = normalizePresetWeapon(skin.weapon);
  if (!cleanWeapon || !skin.name?.trim()) {
    return null;
  }

  url.searchParams.set("weapon", cleanWeapon);
  url.searchParams.set(
    "paint",
    skin.phase ? `${skin.name.trim()} ${skin.phase.trim()}` : skin.name.trim(),
  );

  const floatVal = skin.float ?? wearFloat;
  if (typeof floatVal === "number" && Number.isFinite(floatVal)) {
    url.searchParams.set("wear", String(floatVal));
  }
  if (typeof skin.pattern === "number" && Number.isFinite(skin.pattern)) {
    url.searchParams.set("seed", String(skin.pattern));
  }
  if (skin.isStatTrak) {
    url.searchParams.set("stattrak", "1");
  }
  if (skin.isSouvenir) {
    url.searchParams.set("souvenir", "1");
  }

  return url.href;
}
