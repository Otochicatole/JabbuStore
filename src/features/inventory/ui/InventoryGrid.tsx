"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { InventoryItem } from '../domain/inventory-item';
import { MockInventoryRepository } from '../infrastructure/mock-inventory-repository';

const rarityColors: Record<string, string> = {
  common: 'border-b-[#b0c3d9]',
  uncommon: 'border-b-[#5e98d9]',
  rare: 'border-b-[#4b69ff]',
  mythical: 'border-b-[#8847ff]',
  legendary: 'border-b-[#d32ce6]',
  ancient: 'border-b-[#eb4b4b]',
  immortal: 'border-b-[#e4ae39]',
};

export const InventoryGrid = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const repo = new MockInventoryRepository();
      const data = await repo.getInventory();
      setItems(data);
      if (data.length > 0) setSelectedItem(data[0]);
    };
    fetchInventory();
  }, []);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`aspect-square cursor-pointer border-2 transition-all p-2 ${selectedItem?.id === item.id ? 'border-[#ff4b4b] bg-[#1b1a26]' : 'border-white/5 bg-[#13121d] hover:border-white/20'} relative`}
            >
              <div className="relative h-full w-full">
                <Image src={item.skin.imageUrl} alt={item.skin.name} fill className="object-contain" />
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-full border-b-4 ${rarityColors[item.skin.rarity] || 'border-b-zinc-500'}`} />
            </div>
          ))}
          {/* Fill empty slots */}
          {[...Array(Math.max(0, 25 - items.length))].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-2 border-white/5 bg-[#13121d]/30" />
          ))}
        </div>
      </div>

      {/* Info Panel (Steam Style) */}
      {selectedItem && (
        <div className="w-full lg:w-80 flex flex-col gap-4 animate-fade-in">
          <div className="bg-[#1b1a26] border border-white/5 p-6 rounded-[4px]">
            <div className="relative mb-6 aspect-square w-full">
              <Image src={selectedItem.skin.imageUrl} alt={selectedItem.skin.name} fill className="object-contain" />
            </div>
            <h2 className="text-xl font-black text-white leading-tight mb-1">{selectedItem.skin.name}</h2>
            <p className="text-sm font-bold text-[#84849b] uppercase mb-4">{selectedItem.skin.weapon}</p>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Rarity</p>
                <p className="text-xs font-bold text-white uppercase">{selectedItem.skin.rarity}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Estimated Value</p>
                <p className="text-lg font-black text-[#ff4b4b]">${selectedItem.skin.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Status</p>
                <p className={`text-xs font-bold uppercase ${selectedItem.isTradeable ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedItem.isTradeable ? 'Tradeable' : 'Trade Lock'}
                </p>
              </div>
            </div>

            <button className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold py-3 uppercase tracking-widest transition-colors">
              Sell on Marketplace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
