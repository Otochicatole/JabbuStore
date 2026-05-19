import React from 'react';
import Image from 'next/image';
import { Skin } from '../../skins/domain/skin';
import { useInventory } from '../context/InventoryContext';
import { Zap, Plus, Check, Lock } from 'lucide-react';

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

const rarityHexColors: Record<string, string> = {
  common: '#b0c3d9',
  uncommon: '#5e98d9',
  rare: '#4b69ff',
  mythical: '#8847ff',
  legendary: '#d32ce6',
  ancient: '#eb4b4b',
  immortal: '#e4ae39',
};

const getConditionLabel = (float?: number) => {
  if (float === undefined) return 'Recién fabricado';
  if (float < 0.07) return 'Recién fabricado';
  if (float < 0.15) return 'Casi nuevo';
  if (float < 0.38) return 'Algo desgastado';
  if (float < 0.45) return 'Bastante desgastado';
  return 'Deplorable';
};

const getFloatColorClass = (float?: number) => {
  if (float === undefined) return 'bg-[#10b981]'; // Green
  if (float < 0.07) return 'bg-[#10b981]'; // Factory New (Green)
  if (float < 0.15) return 'bg-[#84cc16]'; // Minimal Wear (Lime)
  if (float < 0.38) return 'bg-[#eab308]'; // Field-Tested (Yellow)
  if (float < 0.45) return 'bg-[#f97316]'; // Well-Worn (Orange)
  return 'bg-[#ef4444]'; // Battle-Scarred (Red)
};


export const InventoryCard = ({ skin, variant = 'sell' }: InventoryCardProps) => {
  const { addToSellList, removeFromSellList, selectedItems, minSellPrice } = useInventory();
  const isSelected = selectedItems.find(item => item.id === skin.id);
  const conditionLabel = skin.exterior || getConditionLabel(skin.float);
  const isBelowMinimum = variant === 'sell' && skin.price < minSellPrice;

  const toggleSelection = () => {
    if (variant === 'simple') return;
    if (isBelowMinimum) return; // Block selection
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
        group relative flex flex-col bg-card rounded-2xl p-4 border transition-all duration-300
        ${isBelowMinimum ? 'cursor-not-allowed opacity-60' : variant === 'sell' ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${isSelected && variant === 'sell' ? 'border-accent shadow-[0_0_20px_rgba(217,70,239,0.2)]' : isBelowMinimum ? 'border-white/5' : 'border-white/5 hover:border-white/10'}
      `}
    >
      {/* Blur overlay for items below minimum */}
      {isBelowMinimum && (
        <div className="absolute inset-0 z-10 rounded-2xl backdrop-blur-[2px] bg-black/30 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
          <Lock className="w-5 h-5 text-white/60" />
          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest text-center px-3">
            Mín. ${minSellPrice.toFixed(2)}
          </p>
        </div>
      )}
      {/* 1. Item Name at the very top */}
      <div className="mb-2">
        <h2 className="text-[9.5px] font-black text-white leading-tight line-clamp-1 uppercase tracking-tight">
          {skin.isStatTrak && <span className="text-[#cf6a32] font-black mr-1 border border-[#cf6a32]/30 px-1 py-0.2 rounded-[3px] bg-[#cf6a32]/10 text-[9px]">ST™</span>}
          {skin.isSouvenir && <span className="text-[#e4ae39] font-black mr-1 border border-[#e4ae39]/30 px-1 py-0.2 rounded-[3px] bg-[#e4ae39]/10 text-[9px]">SV</span>}
          {skin.weapon} | <span className="text-[#aaaaff]">{skin.name}</span>
          {skin.phase && <span className="text-[#d946ef] font-black ml-1">| {skin.phase}</span>}
        </h2>
      </div>

      {/* 2. Compact Info Panel below the name */}
      <div className="flex flex-col gap-1 p-2 rounded-[8px] mb-3 bg-transparent font-mono text-[9px]">
        <div className="flex items-center justify-between">
          <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
            {conditionLabel}
          </span>
          {skin.pattern !== undefined && (
            <span className="text-[#84849b] text-[8px]">
              Semilla: <span className="text-white font-bold">{skin.pattern}</span>
            </span>
          )}
        </div>
        
        {skin.float !== undefined && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[#84849b] text-[8px]">
              <span>Float</span>
              <span className="text-white font-bold">{skin.float.toFixed(6)}</span>
            </div>
            {/* Tiny precise float wear progress bar with wear markers */}
            <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden relative">
              {/* Markers for wear brackets */}
              <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/20" /> {/* FN/MW */}
              <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/20" /> {/* MW/FT */}
              <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/20" /> {/* FT/WW */}
              <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/20" /> {/* WW/BS */}
              
              {/* Wear position indicator */}
              <div 
                className={`h-full ${getFloatColorClass(skin.float)} rounded-full transition-all duration-500`} 
                style={{ width: `${Math.min(100, skin.float * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center mt-2 mb-0 bg-transparent overflow-hidden">
        {/* Spotlight beam coming from below */}
        <div 
          className="absolute bottom-0 left-0 right-0 mx-auto w-full h-[100%] opacity-0 translate-y-6 group-hover:opacity-35 group-hover:translate-y-0 transition-all duration-700 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at bottom, ${rarityHexColors[skin.rarity] || '#ffffff'} 0%, transparent 70%)`,
          }}
        />
        
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
      {/* Price Section */}
      {variant === 'sell' && (
        <div className="flex flex-col gap-0.5 mb-3 mt-auto pt-3 border-t border-white/5">
          <div className="text-lg font-black text-white tracking-tight leading-none">
            ${skin.price.toLocaleString()} <span className="text-[10px] text-muted ml-0.5">USD</span>
          </div>
        </div>
      )}

      {/* Action Area */}
      {variant === 'sell' ? (
        <div className="flex justify-end w-full">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border
            ${isBelowMinimum
              ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
              : isSelected
                ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(217,70,239,0.3)] cursor-pointer'
                : 'bg-secondary text-white border-white/5 hover:bg-secondary/80 cursor-pointer'
            }
          `}>
            {isBelowMinimum ? <Lock className="w-3.5 h-3.5" /> : isSelected ? <Check className="w-4 h-4 stroke-[3px]" /> : <Plus className="w-4 h-4" />}
          </div>
        </div>
      ) : (
        variant === 'simple' && <div className="h-4" />
      )}
    </div>
  );
};
