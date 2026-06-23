import { ArrowUpRight, CheckCircle2, Clock, XCircle } from "lucide-react";

import type { Order, OrderItem } from "@/features/purchases/types";
import type { TranslationParams } from "@/shared/i18n/types";

export const ORDERS_FETCH_TIMEOUT_MS = 15000;

export type PurchaseTab = "all" | "buy" | "sell";
export type Translate = (key: string, params?: TranslationParams) => string;

export const rarityColors: Record<string, string> = {
  common: "border-l-4 border-l-[#b0c3d9]",
  uncommon: "border-l-4 border-l-[#5e98d9]",
  rare: "border-l-4 border-l-[#4b69ff]",
  mythical: "border-l-4 border-l-[#8847ff]",
  legendary: "border-l-4 border-l-[#d32ce6]",
  ancient: "border-l-4 border-l-[#eb4b4b]",
};

export function getOrdersFetchErrorMessage(error: unknown, t: Translate) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return t("purchases.error.timeout");
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return t("purchases.error.backendConnection");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return t("purchases.error.loadOrders");
}

export function getStatusConfig(status: Order["status"], orderType: Order["type"], t: Translate) {
  const isSell = orderType === "SELL";

  switch (status) {
    case "PENDING_PAYMENT":
      return {
        label: isSell ? t("purchases.status.sellPendingApproval") : t("purchases.status.paymentPending"),
        color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        icon: <Clock className="w-3.5 h-3.5 text-orange-400" />,
      };
    case "PAID":
      return {
        label: isSell ? t("purchases.status.tradeConfirmedPendingPayment") : t("purchases.status.paid"),
        color: isSell
          ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
          : "text-blue-400 bg-blue-500/10 border-blue-500/20",
        icon: isSell ? (
          <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
        ),
      };
    case "TRADE_PENDING":
      return {
        label: isSell ? t("purchases.status.sellApprovedSendTrade") : t("purchases.status.tradePending"),
        color: isSell
          ? "text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse"
          : "text-purple-400 bg-purple-500/10 border-purple-500/20",
        icon: isSell ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        ),
      };
    case "COMPLETED":
      return {
        label: isSell ? t("purchases.status.sellCompletedPaid") : t("purchases.status.completed"),
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      };
    case "CANCELLED":
      return {
        label: isSell ? t("purchases.status.sellRejected") : t("purchases.status.cancelled"),
        color: "text-red-400 bg-red-500/10 border-red-500/20",
        icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
      };
    default:
      return {
        label: status,
        color: "text-[#84849b] bg-white/5 border-white/10",
        icon: <Clock className="w-3.5 h-3.5" />,
      };
  }
}

export function getPaymentMethodLabel(paymentMethod: string | null | undefined, t: Translate) {
  if (!paymentMethod) return t("common.notSpecified");
  return t(`paymentMethod.${paymentMethod}.name`);
}

export function getCurrentPurchaseStep(order: Order) {
  if (order.type === "BUY") {
    if (order.status === "PENDING_PAYMENT") return 1;
    if (order.status === "PAID") return 2;
    if (order.status === "TRADE_PENDING") return 3;
    if (order.status === "COMPLETED") return 4;
    return 0;
  }

  if (order.status === "PENDING_PAYMENT") return 1;
  if (order.status === "TRADE_PENDING") return 2;
  if (order.status === "PAID") return 3;
  if (order.status === "COMPLETED") return 4;
  return 0;
}

export function getItemExterior(item: OrderItem) {
  if (item.exterior) return item.exterior;
  const name = item.name.toLowerCase();
  if (name.includes("factory new") || name.includes("(fn)")) return "Factory New";
  if (name.includes("minimal wear") || name.includes("(mw)")) return "Minimal Wear";
  if (name.includes("field-tested") || name.includes("(ft)")) return "Field-Tested";
  if (name.includes("well-worn") || name.includes("(ww)")) return "Well-Worn";
  if (name.includes("battle-scarred") || name.includes("(bs)")) return "Battle-Scarred";
  return null;
}

export function getItemRarity(item: OrderItem) {
  if (item.rarity) return item.rarity;
  const name = item.name.toLowerCase();
  if (
    name.includes("karambit") ||
    name.includes("m9") ||
    name.includes("butterfly") ||
    name.includes("knife") ||
    name.includes("gloves") ||
    name.includes("doppler") ||
    name.includes("fade") ||
    name.includes("vulcan") ||
    name.includes("asiimov")
  ) {
    return "ancient";
  }
  return "common";
}

export function getDisplayFloatData(item: OrderItem) {
  const finalExterior = getItemExterior(item);
  const finalRarity = getItemRarity(item);
  const finalProvider =
    item.provider ||
    (item.assetId &&
    typeof item.assetId === "string" &&
    (item.assetId.startsWith("resell-") ||
      item.assetId.startsWith("youpin-") ||
      item.assetId.startsWith("market-"))
      ? "youpin"
      : "bots");

  const hash = hashCode(item.assetId);
  let displayFloat = item.float ?? null;
  let displayPattern = item.pattern ?? null;

  if (finalProvider === "youpin" && (displayFloat === null || displayPattern === null)) {
    if (displayPattern === null) {
      displayPattern = (hash % 999) + 1;
    }

    if (displayFloat === null) {
      const ext = (finalExterior || "").toLowerCase();
      let minF = 0;
      let maxF = 0.07;
      let hasFloat = true;

      if (ext.includes("factory") || ext.includes("fn")) {
        minF = 0;
        maxF = 0.07;
      } else if (ext.includes("minimal") || ext.includes("mw")) {
        minF = 0.07;
        maxF = 0.15;
      } else if (ext.includes("field") || ext.includes("ft")) {
        minF = 0.15;
        maxF = 0.38;
      } else if (ext.includes("well") || ext.includes("ww")) {
        minF = 0.38;
        maxF = 0.45;
      } else if (ext.includes("battle") || ext.includes("bs")) {
        minF = 0.45;
        maxF = 0.99;
      } else {
        hasFloat = false;
      }

      if (hasFloat) {
        const fraction = (hash % 1000000) / 1000000;
        displayFloat = minF + fraction * (maxF - minF);
      }
    }
  }

  return { finalExterior, finalRarity, displayFloat, displayPattern };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}
