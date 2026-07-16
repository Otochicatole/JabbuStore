"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Skin } from "../../domain/skin";
import { useCart } from "../../../cart/context/CartContext";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { FloatsModal } from "../components/FloatsModal";

// Local microcomponents
import { SkinCardHeader } from "./SkinCardHeader";
import { SkinCardInfoPanel } from "./SkinCardInfoPanel";
import { SkinCardImage } from "./SkinCardImage";
import { SkinCardPrice } from "./SkinCardPrice";
import { SkinCardActions } from "./SkinCardActions";
import { SkinCardModal } from "./SkinCardModal";

// Local helpers
import {
  rarityColors,
  getConditionLabelKey,
  getExteriorLabelKey,
} from "./helpers";

export interface SkinCardProps {
  skinsInGroup: Skin[];
  priority?: boolean;
}

const sortByLowestPrice = (a: Skin, b: Skin) => {
  const priceDifference = a.price - b.price;
  return priceDifference !== 0 ? priceDifference : a.id.localeCompare(b.id);
};

export const SkinCard = ({ skinsInGroup, priority }: SkinCardProps) => {
  const { addToCart, items, removeFromCart } = useCart();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFloatsModalOpen, setIsFloatsModalOpen] = useState(false);
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

  const floatCompatibleCategories = [
    "knife",
    "gloves",
    "rifle",
    "pistol",
    "smg",
    "heavy",
  ];
  const isStickerOrOther =
    skin.weapon?.toLowerCase().includes("sticker") ||
    skin.weapon?.toLowerCase().includes("pegatina") ||
    skin.weapon?.toLowerCase().includes("music kit") ||
    skin.weapon?.toLowerCase().includes("graffiti") ||
    skin.weapon?.toLowerCase().includes("key") ||
    skin.weapon?.toLowerCase().includes("pin") ||
    skin.weapon?.toLowerCase().includes("pass") ||
    !skin.category ||
    !floatCompatibleCategories.includes(skin.category.toLowerCase());
  const showFloatsModalTrigger =
    skin.isImmediate === false &&
    !isStickerOrOther &&
    skin.float === undefined;

  const cartItemsInGroup = items.filter((item) =>
    sortedSkinsInGroup.some((s) => s.id === item.skin.id),
  );
  const totalQuantityInCart = cartItemsInGroup.length;
  const isInCart = totalQuantityInCart > 0;

  const handleActionClick = () => {
    if (showFloatsModalTrigger) {
      setIsFloatsModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleIncrement = () => {
    const nextAvailable = sortedSkinsInGroup.find(
      (s) => !items.some((item) => item.skin.id === s.id),
    );
    if (nextAvailable) {
      addToCart({ ...nextAvailable, isSpecific: false, float: undefined, pattern: undefined });
    }
  };

  const handleDecrement = () => {
    const lastAddedInCart = [...cartItemsInGroup].reverse()[0];
    if (lastAddedInCart) {
      removeFromCart(lastAddedInCart.skin.id);
    }
  };

  return (
    <div
      className={`
      group relative flex w-full flex-col bg-card rounded-2xl p-4 border transition-all duration-500
      ${
        isInCart
          ? "border-accent shadow-[0_0_25px_rgba(217,70,239,0.2)]"
          : "border-white/5 hover:border-white/10"
      }
    `}
    >
      <SkinCardHeader skin={skin} />

      <SkinCardInfoPanel
        skin={skin}
        skinsInGroup={sortedSkinsInGroup}
        isMultiple={isMultiple}
        showFloatsModalTrigger={showFloatsModalTrigger}
        conditionLabel={conditionLabel}
        translateExterior={translateExterior}
        setIsFloatsModalOpen={setIsFloatsModalOpen}
        setIsModalOpen={setIsModalOpen}
        t={t}
      />

      <SkinCardImage
        skin={skin}
        isMultiple={isMultiple}
        priority={priority}
        skinsInGroupCount={sortedSkinsInGroup.length}
      />

      {/* Rarity Divider (stuck perfectly to the bottom of the image container) */}
      <div
        className={`h-[2px] w-full mb-3 rounded-full ${rarityColors[skin.rarity] || "bg-white/10"} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
      />

      <SkinCardPrice price={skin.price} />

      <SkinCardActions
        skin={skin}
        isInCart={isInCart}
        isMultiple={true}
        showFloatsModalTrigger={showFloatsModalTrigger}
        totalQuantityInCart={totalQuantityInCart}
        skinsInGroupLength={sortedSkinsInGroup.length}
        handleActionClick={handleActionClick}
        handleIncrement={handleIncrement}
        handleDecrement={handleDecrement}
        setIsFloatsModalOpen={setIsFloatsModalOpen}
        setIsModalOpen={setIsModalOpen}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        t={t}
      />

      {mounted && isModalOpen && (
        <SkinCardModal
          skin={skin}
          skinsInGroup={sortedSkinsInGroup}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          items={items}
          translateExterior={translateExterior}
          t={t}
        />
      )}

      {mounted && (
        <FloatsModal
          skin={skin}
          isOpen={isFloatsModalOpen}
          onClose={() => setIsFloatsModalOpen(false)}
        />
      )}
    </div>
  );
};
