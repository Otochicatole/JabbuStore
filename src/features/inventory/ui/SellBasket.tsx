"use client";

import React from 'react';
import { useInventory } from '../context/InventoryContext';
import Image from 'next/image';
import { Trash2, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useState } from 'react';

export const SellBasket = () => {
  const { selectedItems, removeFromSellList, totalValue, clearSellList } = useInventory();
  const [selling, setSelling] = useState(false);

  const handleSell = async () => {
    setSelling(true);
    try {
      for (const item of selectedItems) {
        // Here we could prompt for a requested price, for now we use the item's current evaluated price
        const requestedPrice = item.price;
        
        await fetch("http://localhost:3001/api/marketplace/listings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            skinId: item.id,
            requestedPrice
          })
        });
      }
      alert("Items listados exitosamente en el Marketplace.");
      clearSellList();
    } catch (e: any) {
      alert("Error al listar los items: " + e.message);
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-white/5 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Resumen de <span className="text-accent">Venta</span></h3>
        <button 
          onClick={clearSellList}
          className="text-[10px] font-bold text-muted hover:text-white transition-colors uppercase tracking-widest"
        >
          Limpiar
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-6">
        {selectedItems.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Selecciona items para vender</p>
          </div>
        ) : (
          selectedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/5 group">
              <div className="relative w-12 h-12 flex-shrink-0 bg-white/5 rounded-lg flex items-center justify-center p-1">
                <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-white truncate uppercase">{item.weapon} | {item.name}</h4>
                <p className="text-[11px] font-black text-accent">${item.price.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => removeFromSellList(item.id)}
                className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Recibirás</span>
            <span className="text-2xl font-black text-white tracking-tighter">${totalValue.toLocaleString()} <span className="text-xs text-muted">USDT</span></span>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
        </div>

        <button 
          onClick={handleSell}
          disabled={selectedItems.length === 0 || selling}
          className="w-full h-12 bg-accent text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          {selling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {selling ? 'Procesando...' : 'Vender ahora'}
        </button>
        
        <p className="text-[8px] text-center text-muted mt-4 font-bold uppercase tracking-widest leading-relaxed">
          Los fondos se acreditarán <br /> instantáneamente en tu balance.
        </p>
      </div>
    </div>
  );
};
