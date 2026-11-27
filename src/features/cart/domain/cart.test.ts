import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Skin } from "../../skins/domain/skin";
import {
  MAX_CART_ITEM_QUANTITY,
  normalizeCartQuantity,
  supportsMultipleQuantity,
  toValidationId,
} from "./cart";

function makeSkin(overrides: Partial<Skin> = {}): Skin {
  return {
    id: "AK-47 | Redline (Field-Tested)",
    name: "Redline",
    weapon: "AK-47",
    rarity: "classified" as Skin["rarity"],
    price: 25,
    imageUrl: "https://example.com/redline.png",
    provider: "youpin",
    isImmediate: false,
    isSpecific: false,
    ...overrides,
  };
}

describe("cart domain quantity helpers", () => {
  it("allows multiple quantities only for global market (non-specific youpin) listings", () => {
    const globalMarket = makeSkin();
    assert.equal(supportsMultipleQuantity(globalMarket), true);
    assert.equal(normalizeCartQuantity(globalMarket, 5), 5);
    assert.equal(normalizeCartQuantity(globalMarket, 0), 1);
    assert.equal(normalizeCartQuantity(globalMarket, 999), MAX_CART_ITEM_QUANTITY);
    assert.equal(toValidationId(globalMarket), "market-AK-47 | Redline (Field-Tested)");

    const botItem = makeSkin({ id: "12345", provider: "bot", isImmediate: true });
    assert.equal(supportsMultipleQuantity(botItem), false);
    assert.equal(normalizeCartQuantity(botItem, 5), 1);

    const specificYoupinFloat = makeSkin({
      id: "youpin-987654",
      provider: "youpin",
      isImmediate: false,
      isSpecific: true,
    });
    assert.equal(supportsMultipleQuantity(specificYoupinFloat), false);
    assert.equal(normalizeCartQuantity(specificYoupinFloat, 4), 1);
  });
});
