import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Skin } from "../../domain/skin";
import { buildCs2ViewerUrl, supportsCs2Viewer3d } from "./cs2ViewerUrl";

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

  it("uses inspectlink and embed=1 when a valid steam inspect link exists", () => {
    const inspectLink =
      "steam://run/730//+csgo_econ_action_preview%20ABCDEF1234567890ABCDEF1234567890";
    const result = buildCs2ViewerUrl({
      viewerKey: "pk_test_123",
      skin: makeSkin(),
      inspectLink,
      locale: "br",
    });

    assert.ok(result);
    const parsed = new URL(result);
    assert.equal(parsed.origin, "https://3d.cs2screen.com");
    assert.equal(parsed.searchParams.get("key"), "pk_test_123");
    assert.equal(parsed.searchParams.get("embed"), "1");
    assert.equal(parsed.searchParams.get("lang"), "pt");
    assert.equal(parsed.searchParams.get("inspectlink"), inspectLink);
    assert.equal(parsed.searchParams.has("weapon"), false);
  });

  it("falls back to weapon, paint, wear, seed, and stattrak preset when inspectlink is absent", () => {
    const result = buildCs2ViewerUrl({
      viewerKey: "pk_test_123",
      skin: makeSkin({
        weapon: "★ StatTrak™ Karambit",
        name: "Doppler",
        phase: "Phase 2",
        isStatTrak: true,
        pattern: 321,
      }),
      inspectLink: null,
      wearFloat: 0.035,
      locale: "es",
    });

    assert.ok(result);
    const parsed = new URL(result);
    assert.equal(parsed.searchParams.get("key"), "pk_test_123");
    assert.equal(parsed.searchParams.get("embed"), "1");
    assert.equal(parsed.searchParams.get("lang"), "en");
    assert.equal(parsed.searchParams.get("weapon"), "Karambit");
    assert.equal(parsed.searchParams.get("paint"), "Doppler Phase 2");
    assert.equal(parsed.searchParams.get("wear"), "0.035");
    assert.equal(parsed.searchParams.get("seed"), "321");
    assert.equal(parsed.searchParams.get("stattrak"), "1");
  });

  it("rejects unresolved placeholder inspect links and non-3D items without links", () => {
    const urlWithPlaceholder = buildCs2ViewerUrl({
      viewerKey: "pk_test_123",
      skin: makeSkin(),
      inspectLink:
        "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20%propid%",
      wearFloat: 0.26,
    });
    assert.ok(urlWithPlaceholder);
    const parsed = new URL(urlWithPlaceholder);
    assert.equal(parsed.searchParams.has("inspectlink"), false);
    assert.equal(parsed.searchParams.get("weapon"), "AK-47");

    assert.equal(
      supportsCs2Viewer3d(
        makeSkin({ catalogItemType: "container", weapon: "Clutch Case" }),
        null,
      ),
      false,
    );
  });
});
