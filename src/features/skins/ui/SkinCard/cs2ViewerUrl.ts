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

const MASKED_HEX_RE = /csgo_econ_action_preview(?:%20|\+|\s+)([0-9A-Fa-f]{16,})/i;
const STRIPPED_PROTO_FIELDS = new Set([11, 12, 19, 20]);
const IDENTITY_IN_NESTED_DEFINDEXES = new Set([1209, 1355, 4609]);

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function computeInspectChecksum(protoBytes: Uint8Array): number {
  let crc = 0xffffffff;
  crc = CRC32_TABLE[(crc ^ 0) & 0xff]! ^ (crc >>> 8);
  for (let i = 0; i < protoBytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ protoBytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  crc = (0xffffffff ^ crc) >>> 0;
  const mul = Math.imul(protoBytes.length, crc) >>> 0;
  return ((0xffff & crc) ^ mul) >>> 0;
}

function readVarintNumber(bytes: Uint8Array, offset: number): [number, number] | null {
  let value = 0;
  let factor = 1;
  let cursor = offset;

  for (let count = 0; cursor < bytes.length && count < 7; count += 1) {
    const byte = bytes[cursor]!;
    cursor += 1;
    value += (byte & 0x7f) * factor;
    if ((byte & 0x80) === 0) {
      return [value, cursor];
    }
    factor *= 128;
  }

  return null;
}

function skipVarint(bytes: Uint8Array, offset: number): number | null {
  let cursor = offset;
  for (let count = 0; cursor < bytes.length && count < 10; count += 1) {
    const byte = bytes[cursor]!;
    cursor += 1;
    if ((byte & 0x80) === 0) {
      return cursor;
    }
  }
  return null;
}

/**
 * Strips stickers (field 12), charms/variations (19, 20), and custom nametag (11)
 * from a CS2 inspect certificate so the 3D viewer displays the clean skin only.
 */
export function stripInspectLinkStickers(inspectLink: string): string {
  const match = MASKED_HEX_RE.exec(inspectLink.trim());
  if (!match) return inspectLink;

  const hex = match[1]!;
  if (hex.length % 2 !== 0) return inspectLink;

  const rawBytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < rawBytes.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return inspectLink;
    rawBytes[i] = byte;
  }

  if (rawBytes.length < 8) return inspectLink;

  const xorKey = rawBytes[0]!;
  const unmasked = new Uint8Array(rawBytes.length - 1);
  for (let i = 1; i < rawBytes.length; i += 1) {
    unmasked[i - 1] = rawBytes[i]! ^ xorKey;
  }

  const protoPayload = unmasked.subarray(0, -4);
  if (xorKey === 0) {
    const trailer = unmasked.subarray(-4);
    const storedChecksum =
      ((trailer[0]! << 24) |
        (trailer[1]! << 16) |
        (trailer[2]! << 8) |
        trailer[3]!) >>>
      0;
    if (computeInspectChecksum(protoPayload) !== storedChecksum) {
      return inspectLink;
    }
  }

  const keptSegments: Uint8Array[] = [];
  let cursor = 0;
  let defIndex: number | null = null;

  while (cursor < protoPayload.length) {
    const start = cursor;
    const tagRead = readVarintNumber(protoPayload, cursor);
    if (!tagRead) return inspectLink;

    const [tag, afterTag] = tagRead;
    cursor = afterTag;
    const fieldNumber = Math.floor(tag / 8);
    const wireType = tag & 7;

    if (wireType === 0) {
      if (fieldNumber === 3) {
        const valRead = readVarintNumber(protoPayload, cursor);
        if (!valRead) return inspectLink;
        defIndex = valRead[0];
        cursor = valRead[1];
      } else {
        const nextCursor = skipVarint(protoPayload, cursor);
        if (nextCursor === null) return inspectLink;
        cursor = nextCursor;
      }
    } else if (wireType === 1) {
      if (cursor + 8 > protoPayload.length) return inspectLink;
      cursor += 8;
    } else if (wireType === 2) {
      const lenRead = readVarintNumber(protoPayload, cursor);
      if (!lenRead) return inspectLink;
      const [len, afterLen] = lenRead;
      if (len < 0 || afterLen + len > protoPayload.length) {
        return inspectLink;
      }
      cursor = afterLen + len;
    } else if (wireType === 5) {
      if (cursor + 4 > protoPayload.length) return inspectLink;
      cursor += 4;
    } else {
      return inspectLink;
    }

    if (!STRIPPED_PROTO_FIELDS.has(fieldNumber)) {
      keptSegments.push(protoPayload.subarray(start, cursor));
    }
  }

  // Stickers (1209), charms / sticker slabs (1355), and patches (4609)
  // store their own item identity in fields 12/20 — never strip those fields from them.
  if (defIndex !== null && IDENTITY_IN_NESTED_DEFINDEXES.has(defIndex)) {
    return inspectLink.trim();
  }

  const cleanLen = keptSegments.reduce((sum, seg) => sum + seg.length, 0);
  const cleanProto = new Uint8Array(cleanLen);
  let writeOffset = 0;
  for (const segment of keptSegments) {
    cleanProto.set(segment, writeOffset);
    writeOffset += segment.length;
  }

  const checksum = computeInspectChecksum(cleanProto);
  const outBytes = new Uint8Array(1 + cleanProto.length + 4);
  outBytes[0] = 0;
  outBytes.set(cleanProto, 1);
  outBytes[1 + cleanProto.length] = (checksum >>> 24) & 0xff;
  outBytes[2 + cleanProto.length] = (checksum >>> 16) & 0xff;
  outBytes[3 + cleanProto.length] = (checksum >>> 8) & 0xff;
  outBytes[4 + cleanProto.length] = checksum & 0xff;

  const cleanHex = Array.from(outBytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `steam://run/730/+csgo_econ_action_preview+${cleanHex}`;
}

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
  if (skin.catalogItemType && SUPPORTED_VIEWER_NON_3D_TYPES.has(skin.catalogItemType)) {
    return false;
  }
  const effectiveLink = inspectLink ?? skin.inspectLink;
  if (isValidSteamInspectLink(effectiveLink)) {
    return true;
  }
  if (skin.provider === "bot" || skin.isImmediate === true) {
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
 * Only builds the embed URL when a valid Steam inspect link exists (avoiding black-screen embeds),
 * and strips applied stickers and charms before embedding.
 */
export function buildCs2ViewerUrl({
  viewerKey,
  skin,
  inspectLink,
  locale,
}: BuildCs2ViewerUrlParams): string | null {
  const cleanKey = viewerKey?.trim();
  if (!cleanKey) return null;

  const effectiveInspectLink = inspectLink ?? skin.inspectLink;
  if (!isValidSteamInspectLink(effectiveInspectLink)) {
    return null;
  }

  const url = new URL(`${CS2_VIEWER_ORIGIN}/`);
  url.searchParams.set("key", cleanKey);
  url.searchParams.set("embed", "1");
  url.searchParams.set("lang", mapLocaleToViewerLang(locale));
  url.searchParams.set(
    "inspectlink",
    stripInspectLinkStickers(effectiveInspectLink.trim()),
  );
  return url.href;
}
