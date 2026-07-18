import Link from "next/link";
import { Tag, Ticket } from "lucide-react";

import type { OrderItem } from "@/features/purchases/types";

import { getDisplayFloatData, rarityColors, type Translate } from "./helpers";
import { Money } from "@/features/currency/ui/Money";

interface PurchaseItemsListProps {
  items: OrderItem[];
  t: Translate;
  raffleId?: string | null;
  raffleName?: string | null;
  ticketsCount?: number | null;
  userChancesInRaffle?: number | null;
  localizePath?: (path: string) => string;
}

export function PurchaseItemsList({
  items,
  t,
  raffleId,
  raffleName,
  ticketsCount,
  userChancesInRaffle,
  localizePath,
}: PurchaseItemsListProps) {
  const isRaffleOrder =
    Boolean(raffleId) || (items.length > 0 && items.every((i) => i.provider === "raffle"));

  if (isRaffleOrder) {
    const chancesInOrder = ticketsCount ?? items.length;
    const showTotal =
      userChancesInRaffle != null && userChancesInRaffle > chancesInOrder;

    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-2 block pt-2">
          {t("purchases.includedItems", { count: chancesInOrder })}
        </h4>
        <div className="flex flex-col gap-3 bg-[#0d0b16] p-4 rounded-[3px] border border-accent/10 hover:border-accent/20 transition-colors relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-10 bg-accent/5 rounded-lg flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-white block">
                {t("purchases.raffleChancesInOrder", { count: chancesInOrder })}
                {raffleName ? ` — "${raffleName}"` : ""}
              </span>
              {showTotal && (
                <span className="text-[10px] font-bold text-emerald-400 block mt-1">
                  {t("purchases.userChancesInRaffle", { count: userChancesInRaffle })}
                </span>
              )}
              <span className="text-[9px] font-mono text-accent block mt-0.5 uppercase tracking-wider">
                Sorteo CS2
              </span>
            </div>
            <div className="shrink-0 text-right">
              <Money amountUsd={items.reduce((sum, item) => sum + item.price, 0)} approximate className="text-xs font-black text-accent block" />
              <span className="text-[8px] text-[#84849b] font-mono uppercase">
                {t("purchases.unitPrice")}
              </span>
            </div>
          </div>
          {raffleId && localizePath && (
            <Link
              href={localizePath(`/raffles/${raffleId}`)}
              className="text-[10px] font-black uppercase tracking-wider text-accent hover:text-white transition-colors"
            >
              {t("purchases.viewRaffle")} →
            </Link>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-2 block pt-2">
        {t("purchases.includedItems", { count: items.length })}
      </h4>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <PurchaseItemCard key={item.id} item={item} t={t} />
        ))}
      </div>
    </div>
  );
}

function PurchaseItemCard({ item, t }: { item: OrderItem; t: Translate }) {
  const { finalExterior, finalRarity, displayFloat, displayPattern } = getDisplayFloatData(item);
  const isStatTrak = item.name.includes("StatTrak");
  const isSouvenir = item.name.includes("Souvenir");

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-4 bg-[#0d0b16] p-4 rounded-[3px] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group ${
        rarityColors[finalRarity] || ""
      }`}
    >
      <div className="w-16 h-12 bg-white/5 rounded-lg flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner">
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            alt={item.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Tag className="w-4 h-4 text-white/20" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-white truncate">{item.name}</span>
          {isStatTrak && <ItemBadge className="bg-orange-500/10 text-orange-400 border-orange-500/20">StatTrak</ItemBadge>}
          {isSouvenir && <ItemBadge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Souvenir</ItemBadge>}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-mono text-[#84849b]">
          {finalExterior && (
            <span className="text-white font-sans uppercase font-extrabold bg-white/5 px-1.5 py-0.2 rounded-sm">
              {finalExterior}
            </span>
          )}
          {displayPattern !== null && (
            <span>
              {t("checkout.seed")}: <span className="text-white font-bold">{displayPattern}</span>
            </span>
          )}
        </div>
      </div>

      <FloatDisplay displayFloat={displayFloat} t={t} />

      <div className="text-right ml-auto">
        <Money amountUsd={item.price} approximate className="text-xs font-black text-accent block" />
        <span className="text-[8px] text-[#84849b] font-mono uppercase">
          {t("purchases.unitPrice")}
        </span>
      </div>
    </div>
  );
}

function ItemBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`text-[7.5px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded-[2px] ${className}`}>
      {children}
    </span>
  );
}

function FloatDisplay({ displayFloat, t }: { displayFloat: number | null; t: Translate }) {
  if (displayFloat === null) {
    return (
      <div className="w-full md:w-36 bg-[#110f1e]/20 p-2 border border-white/5 rounded-[3px] shrink-0">
        <span className="text-[8px] uppercase tracking-wider font-black text-[#84849b] block">
          {t("purchases.registeredFloat")}
        </span>
        <span className="text-[10px] text-white/30 font-mono block mt-0.5">
          {t("purchases.activeDeliveryFallback")}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full md:w-36 bg-[#110f1e]/20 p-2 border border-white/5 rounded-[3px] shrink-0">
      <span className="text-[8px] uppercase tracking-wider font-black text-[#84849b] block">
        {t("purchases.registeredFloat")}
      </span>
      <span className="text-[10px] font-bold font-mono text-white block mt-0.5">
        {displayFloat.toFixed(8)}
      </span>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
        <div
          className={`h-full rounded-full ${
            displayFloat < 0.07 ? "bg-emerald-400" : displayFloat < 0.15 ? "bg-blue-400" : "bg-yellow-400"
          }`}
          style={{ width: `${Math.min(100, displayFloat * 100)}%` }}
        />
      </div>
    </div>
  );
}
