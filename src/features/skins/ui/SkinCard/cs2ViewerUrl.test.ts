import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Skin } from "../../domain/skin";
import {
  buildCs2ViewerUrl,
  stripInspectLinkStickers,
  supportsCs2Viewer3d,
} from "./cs2ViewerUrl";

function makeSkin(overrides: Partial<Skin> = {}): Skin {
  return {
    id: "AK-47 | Redline (Field-Tested)",
    name: "Redline",
    weapon: "AK-47",
    rarity: "classified" as Skin["rarity"],
    price: 25,
    imageUrl: "https://example.com/redline.png",
    exterior: "Field-Tested",
    catalogItemType: "rifle",
    ...overrides,
  };
}

function buildMaskedInspectWithChecksum(protoHex: string): string {
  const protoBytes = Uint8Array.from(
    protoHex.match(/../g)!.map((h) => Number.parseInt(h, 16)),
  );
  // Build unsigned checksum using CRC32 identical to CS2 masked inspect links
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  crc = table[(crc ^ 0) & 0xff]! ^ (crc >>> 8);
  for (const b of protoBytes) crc = table[(crc ^ b) & 0xff]! ^ (crc >>> 8);
  crc = (0xffffffff ^ crc) >>> 0;
  const mul = Math.imul(protoBytes.length, crc) >>> 0;
  const checksum = ((0xffff & crc) ^ mul) >>> 0;
  const trailer = [
    (checksum >>> 24) & 0xff,
    (checksum >>> 16) & 0xff,
    (checksum >>> 8) & 0xff,
    checksum & 0xff,
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `steam://run/730//+csgo_econ_action_preview%2000${protoHex.toUpperCase()}${trailer}`;
}

describe("cs2ViewerUrl", () => {
  it("returns null when viewer key is missing", () => {
    assert.equal(
      buildCs2ViewerUrl({
        viewerKey: "",
        skin: makeSkin(),
      }),
      null,
    );
  });

  it("strips stickers (field 12), charms/variations (20), and nametag (11) from masked inspect links", () => {
    // Field 3 (defindex=7): 18 07
    // Field 4 (paintindex=1): 20 01
    // Field 11 (customname="AB"): 5A 02 41 42
    // Field 12 (stickers submessage): 62 04 08 01 10 05
    // Field 20 (variation/keychain): A2 01 02 08 02
    const withStickersProto = "180720015A024142620408011005A201020802";
    const expectedCleanProto = "18072001";

    const dirtyLink = buildMaskedInspectWithChecksum(withStickersProto);
    const cleanedLink = stripInspectLinkStickers(dirtyLink);
    const expectedCleanLink = buildMaskedInspectWithChecksum(expectedCleanProto).replace(
      "//+csgo_econ_action_preview%20",
      "/+csgo_econ_action_preview+",
    );

    assert.equal(cleanedLink, expectedCleanLink);

    const url = buildCs2ViewerUrl({
      viewerKey: "pk_test_123",
      skin: makeSkin(),
      inspectLink: dirtyLink,
      locale: "br",
    });
    assert.ok(url);
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("inspectlink"), expectedCleanLink);
    assert.equal(parsed.searchParams.get("lang"), "pt");
  });

  it("strips stickers cleanly from real XOR-masked SteamWebAPI certificates", () => {
    const sample =
      "steam://run/730//+csgo_econ_action_preview%203A2AFDEC99B99B3B22B13E1AE23C123C0A390280F6B1D2397AEB3B723A6ABB3952244A32899C03EE";
    const cleaned = stripInspectLinkStickers(sample);
    assert.ok(cleaned.startsWith("steam://run/730/+csgo_econ_action_preview+00"));
    assert.ok(cleaned.length >= 20);
  });

  it("returns null when inspectlink is absent or unresolved so the viewer never renders a black screen", () => {
    assert.equal(
      buildCs2ViewerUrl({
        viewerKey: "pk_test_123",
        skin: makeSkin({
          weapon: "★ StatTrak™ Karambit",
          name: "Doppler",
          phase: "Phase 2",
          isStatTrak: true,
        }),
        inspectLink: null,
        wearFloat: 0.035,
        locale: "es",
      }),
      null,
    );

    assert.equal(
      buildCs2ViewerUrl({
        viewerKey: "pk_test_123",
        skin: makeSkin(),
        inspectLink:
          "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20%propid%",
        wearFloat: 0.26,
      }),
      null,
    );

    assert.equal(
      supportsCs2Viewer3d(
        makeSkin({ catalogItemType: "container", weapon: "Clutch Case" }),
        null,
      ),
      false,
    );
  });
});
