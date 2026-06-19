import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Image from 'next/image';
import { Trash2, TrendingUp, DollarSign, Loader2, AlertTriangle, Info } from 'lucide-react';
import { BACKEND_URL, fetchWithAuth } from '@/shared/lib/api';
import { useRouter } from 'next/navigation';

interface SellBasketProps {
  embedded?: boolean;
}

export const SellBasket = ({ embedded = false }: SellBasketProps) => {
  const { selectedItems, removeFromSellList, totalValue, clearSellList, minSellPrice } = useInventory();
  const router = useRouter();
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [sellSuccess, setSellSuccess] = useState(false);


  // Items that don't meet the minimum sell price
  const invalidItems = selectedItems.filter((item) => item.price < minSellPrice);
  const validItems = selectedItems.filter((item) => item.price >= minSellPrice);
  const canSell = validItems.length > 0 && !selling;

  const handleSell = async () => {
    setSelling(true);
    setSellError(null);
    setSellSuccess(false);

    try {
      // Redirigir a la página de checkout de venta
      router.push("/checkout?type=sell");
    } catch (e: unknown) {
      setSellError(e instanceof Error ? e.message : 'Error desconocido al iniciar el checkout de venta.');
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className={`${embedded ? "bg-transparent p-0 border-0 rounded-none" : "bg-card rounded-2xl p-4 sm:p-6 border border-white/5 lg:sticky lg:top-24"}`}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">
          Resumen de <span className="text-accent">Venta</span>
        </h3>
        {selectedItems.length > 0 && (
          <button
            onClick={clearSellList}
            className="text-[10px] font-bold text-muted hover:text-white transition-colors uppercase tracking-widest"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Min price info badge */}
      {minSellPrice > 0 && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
          <Info className="w-3 h-3 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-accent/80">
            Precio mínimo de venta: <span className="text-accent">${minSellPrice.toFixed(2)} USD</span>
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar mb-6">
        {selectedItems.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">
              Selecciona items para vender
            </p>
          </div>
        ) : (
          selectedItems.map((item) => {
            const meetsMinimum = item.price >= minSellPrice;
            return (
              <div
                key={item.id}
                className={`flex items-start sm:items-center gap-3 p-3 rounded-xl border group transition-colors ${
                  meetsMinimum
                    ? 'bg-background/50 border-white/5'
                    : 'bg-red-500/5 border-red-500/15'
                }`}
              >
                <div className="relative w-12 h-12 shrink-0 bg-white/5 rounded-lg flex items-center justify-center p-1">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-white truncate uppercase">
                    {item.weapon} | {item.name}
                  </h4>
                  <p className={`text-[11px] font-black ${meetsMinimum ? 'text-accent' : 'text-red-400'}`}>
                    ${item.price.toLocaleString()}
                  </p>
                  {!meetsMinimum && (
                    <p className="text-[9px] text-red-400/80 font-bold flex items-center gap-0.5 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Mínimo: ${minSellPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFromSellList(item.id)}
                  className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Invalid items warning */}
      {invalidItems.length > 0 && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
          <p className="text-[10px] font-bold text-red-400">
            {invalidItems.length} item{invalidItems.length > 1 ? 's' : ''} no cumple{invalidItems.length > 1 ? 'n' : ''} el precio mínimo y no se venderá{invalidItems.length > 1 ? 'n' : ''}.
          </p>
        </div>
      )}

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Recibirás</span>
            <span className="text-2xl font-black text-white tracking-tighter">
              ${validItems.reduce((sum, i) => sum + i.price, 0).toLocaleString()}{' '}
              <span className="text-xs text-muted">USD</span>
            </span>
            {invalidItems.length > 0 && (
              <span className="text-[9px] text-red-400/80 font-bold mt-0.5">
                ({invalidItems.length} excluido{invalidItems.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
        </div>

        {/* Error message */}
        {sellError && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
            <p className="text-[10px] font-bold text-red-400 whitespace-pre-line">{sellError}</p>
          </div>
        )}

        {/* Success message */}
        {sellSuccess && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-[10px] font-bold text-emerald-400">¡Items listados exitosamente en el Marketplace!</p>
          </div>
        )}

        <button
          onClick={handleSell}
          disabled={!canSell}
          className="w-full h-12 bg-accent text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          {selling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {selling ? 'Procesando...' : validItems.length > 0 ? `Vender ${validItems.length} item${validItems.length > 1 ? 's' : ''}` : 'Vender ahora'}
        </button>

        <p className="text-[8px] text-center text-muted mt-4 font-bold uppercase tracking-widest leading-relaxed">
          Los fondos se acreditarán <br /> instantáneamente en tu balance.
        </p>
      </div>
    </div>
  );
};
