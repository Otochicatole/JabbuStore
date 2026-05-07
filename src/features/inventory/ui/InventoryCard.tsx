import React from 'react';
import Image from 'next/image';
import { Skin } from '../../skins/domain/skin';
import { useInventory } from '../context/InventoryContext';
import { Zap, Plus, Check } from 'lucide-react';

interface InventoryCardProps {
  skin: Skin;
  variant?: 'simple' | 'sell';
}

const rarityColors: Record<string, string> = {
  common: 'bg-[#b0c3d9]',
  uncommon: 'bg-[#5e98d9]',
  rare: 'bg-[#4b69ff]',
  mythical: 'bg-[#8847ff]',
  legendary: 'bg-[#d32ce6]',
  ancient: 'bg-[#eb4b4b]',
  immortal: 'bg-[#e4ae39]',
};

const getConditionLabel = (float?: number) => {
  if (float === undefined) return 'Recién fabricado';
  if (float < 0.07) return 'Recién fabricado';
  if (float < 0.15) return 'Casi nuevo';
  if (float < 0.38) return 'Algo desgastado';
  if (float < 0.45) return 'Bastante desgastado';
  return 'Deplorable';
};

export const InventoryCard = ({ skin, variant = 'sell' }: InventoryCardProps) => {
  const { addToSellList, removeFromSellList, selectedItems } = useInventory();
  const isSelected = selectedItems.find(item => item.id === skin.id);
  const conditionLabel = skin.exterior || getConditionLabel(skin.float);

  const toggleSelection = () => {
    if (variant === 'simple') return;
    if (isSelected) {
      removeFromSellList(skin.id);
    } else {
      addToSellList(skin);
    }
  };

  return (
    <div 
      onClick={toggleSelection}
      className={`
        group relative flex flex-col bg-card rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-1
        ${variant === 'sell' ? 'cursor-pointer' : ''}
        ${isSelected && variant === 'sell' ? 'border-accent shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'border-white/5 hover:border-white/10'}
      `}
    >
      {/* 1. Item Name at the very top */}
      <div className="mb-2">
        <h2 className="text-[11px] font-black text-white leading-tight line-clamp-1 uppercase tracking-tight">
          {skin.isStatTrak && <span className="text-[#cf6a32] font-black mr-1 border border-[#cf6a32]/30 px-1 py-0.2 rounded-[3px] bg-[#cf6a32]/10 text-[9px]">ST™</span>}
          {skin.isSouvenir && <span className="text-[#e4ae39] font-black mr-1 border border-[#e4ae39]/30 px-1 py-0.2 rounded-[3px] bg-[#e4ae39]/10 text-[9px]">SV</span>}
          {skin.weapon} | <span className="text-[#aaaaff]">{skin.name}</span>
        </h2>
      </div>

      {/* 2. Compact Info Panel below the name */}
      <div className="flex flex-col gap-1.5 p-2 rounded-[8px] mb-3">
        <div className="flex items-center justify-between text-[9px] text-[#84849b] font-mono">
          {skin.float !== undefined ? (
            <span className="flex items-center gap-1.5">
              <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">{conditionLabel}</span>
              <span className="text-white/40">({skin.float.toFixed(4)})</span>
            </span>
          ) : (
            <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">{conditionLabel}</span>
          )}
          
          {/* Seed / Pattern */}
          {skin.pattern !== undefined && (
            <span className="flex items-center gap-1">
              <span className="font-sans font-black text-white/30 uppercase text-[8px] tracking-wider">Seed</span>
              <span className="text-white/80 font-bold">{skin.pattern}</span>
            </span>
          )}
        </div>

        {/* Visual Float progress bar */}
        {skin.float !== undefined && (
          <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden relative">
            <div 
              style={{ width: `${(1 - skin.float) * 100}%` }}
              className={`h-full rounded-full ${
                skin.float < 0.07 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                skin.float < 0.15 ? 'bg-emerald-400' :
                skin.float < 0.38 ? 'bg-yellow-500' :
                skin.float < 0.45 ? 'bg-orange-500' : 'bg-red-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center my-2">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity duration-500 ${rarityColors[skin.rarity] || 'bg-white'}`} />
        
        <Image
          src={skin.imageUrl}
          alt={skin.name}
          width={180}
          height={130}
          className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Rarity Divider */}
      <div className={`h-[2px] w-full mb-3 rounded-full ${rarityColors[skin.rarity] || 'bg-white/10'} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />

      {/* Price Section */}
      {variant === 'sell' && (
        <div className="flex flex-col gap-0.5 mb-4">
          <div className="text-lg font-black text-white tracking-tight leading-none">
            ${skin.price.toLocaleString()} <span className="text-[10px] text-muted ml-0.5">USD</span>
          </div>
        </div>
      )}

      {/* Action Area */}
      {variant === 'sell' && (
        <div className="flex justify-end mt-auto pt-2">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border
            ${isSelected 
              ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(217,70,239,0.3)]' 
              : 'bg-secondary text-white border-white/5 hover:bg-secondary/80'
            }
          `}>
            {isSelected ? <Check className="w-4 h-4 stroke-[3px]" /> : <Plus className="w-4 h-4" />}
          </div>
        </div>
      )}

      {variant === 'simple' && <div className="h-4" />}
    </div>
  );
};
