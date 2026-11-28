import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowPriceFrom } from "./helpers";

describe("SkinCard helpers - shouldShowPriceFrom", () => {
  it("returns true for single-exterior or exteriorless YouPin market listings (e.g. stickers, Dopplers, single-wear skins)", () => {
    assert.equal(shouldShowPriceFrom({ provider: "youpin", isImmediate: false }, 1, 0), true);
    assert.equal(shouldShowPriceFrom({ provider: "youpin", isImmediate: false }, 1, 1), true);
    assert.equal(shouldShowPriceFrom({ provider: "youpin", isImmediate: false }, 2, 1), true);
  });

  it("returns true when a group has multiple variants or multiple exteriors even with immediate bot items", () => {
    assert.equal(shouldShowPriceFrom({ provider: "bot", isImmediate: true }, 2, 1), true);
    assert.equal(shouldShowPriceFrom({ provider: "bot", isImmediate: true }, 3, 2), true);
  });

  it("returns false only for a single specific immediate bot asset", () => {
    assert.equal(shouldShowPriceFrom({ provider: "bot", isImmediate: true }, 1, 1), false);
    assert.equal(shouldShowPriceFrom({ provider: "bot", isImmediate: true }, 1, 0), false);
  });
});
