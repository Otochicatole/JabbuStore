import React from 'react';
import { Coins, Ticket } from 'lucide-react';
import { CheckoutItem } from '../../domain/types';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface ItemsReviewProps {
  items: CheckoutItem[];
  selectedMethod: string | null;
}

function isRaffleCheckoutItem(item: CheckoutItem): boolean {
  return (
    item.provider === "raffle" ||
    item.assetId.toLowerCase().startsWith("raffle-ticket-")
  );
}

function ItemThumbnail({ item }: { item: CheckoutItem }) {
  if (isRaffleCheckoutItem(item)) {
    return (
      <div className="w-full h-full bg-accent/10 rounded-lg flex items-center justify-center">
        <Ticket className="w-6 h-6 text-accent" />
      </div>
    );
  }

  if (item.iconUrl) {
    return (
      <img
        src={item.iconUrl}
        alt={item.name}
        className="w-full h-full object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-accent/10 rounded flex items-center justify-center">
      <Coins className="w-5 h-5 text-accent" />
    </div>
  );
}

function ItemSpecs({ item }: { item: CheckoutItem }) {
  const { t } = useI18n();
  const hasFloat = item.float !== null && item.float !== undefined;
  const hasPattern = item.pattern !== null && item.pattern !== undefined;
  const hasExterior = Boolean(item.exterior);
  const hasSpecs = hasFloat || hasPattern || hasExterior;

  if (!hasSpecs) {
    return (
      <p className="text-[9px] text-[#84849b]/70 font-mono mt-1 uppercase">
        {t("checkout.noItemSpecs")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {hasExterior && (
        <span className="text-[8px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 py-0.5 rounded-sm border border-white/5">
          {item.exterior}
        </span>
      )}
      {hasFloat && (
        <span className="text-[8px] font-mono text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-sm">
          Float: {item.float!.toFixed(10)}
        </span>
      )}
      {hasPattern && (
        <span className="text-[8px] font-mono text-white/80 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm">
          {t("checkout.seed")}: {item.pattern}
        </span>
      )}
    </div>
  );
}

export function ItemsReview({ items, selectedMethod }: ItemsReviewProps) {
  const { t } = useI18n();

  return (
    <section className="bg-card border border-white/5 rounded-3xl p-4 sm:p-6 md:p-8">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-accent rounded-full" />
        {selectedMethod ? "3." : "2."} {t("checkout.reviewItems")} ({items.length})
      </h2>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.assetId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                <ItemThumbnail item={item} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">{item.name}</h4>
                {!isRaffleCheckoutItem(item) && (
                  <p className="text-[9px] text-[#84849b] font-mono mt-1 uppercase truncate sm:break-all">Asset: {item.assetId}</p>
                )}
                {isRaffleCheckoutItem(item) ? (
                  <p className="text-[9px] text-accent font-bold uppercase tracking-wider mt-1">
                    Sorteo CS2
                  </p>
                ) : (
                  <ItemSpecs item={item} />
                )}
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <p className="text-xs font-black text-white">${item.price.toFixed(2)}</p>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">{t("checkout.ready")}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default ItemsReview;
