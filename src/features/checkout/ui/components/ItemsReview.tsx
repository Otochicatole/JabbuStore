import React from 'react';
import { Coins } from 'lucide-react';
import { CheckoutItem } from '../../domain/types';

interface ItemsReviewProps {
  items: CheckoutItem[];
  selectedMethod: string | null;
}

export function ItemsReview({ items, selectedMethod }: ItemsReviewProps) {
  return (
    <section className="bg-card border border-white/5 rounded-3xl p-6 md:p-8">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-accent rounded-full" />
        {selectedMethod ? "3." : "2."} Revisa tus Artículos ({items.length})
      </h2>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.assetId} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-accent/10 rounded flex items-center justify-center">
                    <Coins className="w-5 h-5 text-accent" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">{item.name}</h4>
                <p className="text-[9px] text-[#84849b] font-mono mt-1 uppercase">Asset: {item.assetId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-white">${item.price.toFixed(2)}</p>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Listo</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default ItemsReview;
