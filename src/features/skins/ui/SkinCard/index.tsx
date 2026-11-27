"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Skin } from "../../domain/skin";
import { useCart } from "../../../cart/context/CartContext";
import { useI18n } from "@/shared/i18n/I18nProvider";

// Local microcomponents
import { SkinCardHeader } from "./SkinCardHeader";
import { SkinCardInfoPanel } from "./SkinCardInfoPanel";
import { SkinCardImage } from "./SkinCardImage";
import { SkinCardPrice } from "./SkinCardPrice";
import { SkinCardModal } from "./SkinCardModal";

// Local helpers
import {
  rarityColors,
  getConditionLabelKey,
  getExteriorLabelKey,
  getExteriorAbbreviation,
} from "./helpers";

const EXTERIOR_ORDER = ["FN", "MW", "FT", "WW", "BS"];

export interface SkinCardProps {
  skinsInGroup: Skin[];
  priority?: boolean;
}

const sortByLowestPrice = (a: Skin, b: Skin) => {
  const priceDifference = a.price - b.price;
  return priceDifference !== 0 ? priceDifference : a.id.localeCompare(b.id);
};

export const SkinCard = ({ skinsInGroup, priority }: SkinCardProps) => {
  const { addToCart, updateQuantity, setItemQuantity, removeFromCart, items } = useCart();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const sortedSkinsInGroup = useMemo(
    () => [...(skinsInGroup ?? [])].sort(sortByLowestPrice),
    [skinsInGroup],
  );

  if (sortedSkinsInGroup.length === 0) return null;

  const skin = sortedSkinsInGroup[0]!;
  const conditionLabel = t(getConditionLabelKey(skin.float));
  const translateExterior = (exterior: string | null | undefined, fallback: string) => {
    const labelKey = getExteriorLabelKey(exterior);
    return labelKey ? t(labelKey) : fallback;
  };
  const isMultiple = sortedSkinsInGroup.length >= 2;
  const distinctExteriors = Array.from(
    new Set(
      sortedSkinsInGroup
        .map((s) => getExteriorAbbreviation(s.exterior))
        .filter(Boolean),
    ),
  ).sort((a, b) => EXTERIOR_ORDER.indexOf(a) - EXTERIOR_ORDER.indexOf(b));
  const hasMixedStatTrak =
    sortedSkinsInGroup.some((s) => s.isStatTrak) &&
    sortedSkinsInGroup.some((s) => !s.isStatTrak);

  const isInCart = sortedSkinsInGroup.some((s) =>
    items.some((item) => item.skin.id === s.id),
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className={`
        group relative flex w-full flex-col bg-card rounded-2xl p-4 border transition-all duration-500 cursor-pointer
        ${
          isInCart
            ? "border-accent shadow-[0_0_25px_rgba(217,70,239,0.2)]"
            : "border-white/5 hover:border-white/15"
        }
      `}
      >
        <SkinCardHeader skin={skin} hasMixedStatTrak={hasMixedStatTrak} />

        <SkinCardInfoPanel
          skin={skin}
          isMultiple={isMultiple}
          distinctExteriors={distinctExteriors}
          conditionLabel={conditionLabel}
          translateExterior={translateExterior}
          t={t}
        />

        <SkinCardImage
          skin={skin}
          priority={priority}
        />

        {/* Rarity Divider (stuck perfectly to the bottom of the image container) */}
        <div
          className={`h-[2px] w-full mb-3 rounded-full ${rarityColors[skin.rarity] || "bg-white/10"} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
        />

        <SkinCardPrice
          price={skin.price}
          priceFromLabel={distinctExteriors.length > 1 ? t("skinCard.priceFrom") : undefined}
        />
      </div>

      {mounted && isModalOpen && (
        <SkinCardModal
          skin={skin}
          skinsInGroup={sortedSkinsInGroup}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          setItemQuantity={setItemQuantity}
          removeFromCart={removeFromCart}
          items={items}
          translateExterior={translateExterior}
          t={t}
        />
      )}
    </>
  );
};
