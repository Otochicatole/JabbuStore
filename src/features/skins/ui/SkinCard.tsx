import Image from 'next/image';
import { Skin } from '../domain/skin';
import { useCart } from '../../cart/context/CartContext';
import { ShoppingCart, Star, Zap, Plus, Minus } from 'lucide-react';

interface SkinCardProps {
  skin: Skin;
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

export const SkinCard = ({ skin }: SkinCardProps) => {
  const { addToCart, items, updateQuantity } = useCart();
  const conditionLabel = getConditionLabel(skin.float);

  const cartItem = items.find(item => item.skin.id === skin.id);
  const isInCart = !!cartItem;

  return (
    <div className={`
      group relative flex flex-col bg-card rounded-2xl p-4 border transition-all duration-500 hover:-translate-y-1
      ${isInCart 
        ? 'border-accent shadow-[0_0_25px_rgba(217,70,239,0.2)]' 
        : 'border-white/5 hover:border-white/10'
      }
    `}>
      {/* Header Info */}
      <div className="flex flex-col gap-0.5 mb-2">
        <div className="flex items-center gap-1">
          <h2 className="text-[11px] font-black text-white leading-tight line-clamp-1 uppercase tracking-tight">
            {skin.weapon} | <span className="text-[#aaaaff]">{skin.name}</span>
          </h2>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-tight">
          {conditionLabel}
        </span>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center my-2">
        {/* Subtle rarity glow */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity duration-500 ${rarityColors[skin.rarity] || 'bg-white'}`} />
        
        <Image
          src={skin.imageUrl}
          alt={skin.name}
          width={180}
          height={130}
          className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Badges */}
      <div className="mb-3">
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[9px] font-black uppercase tracking-wider">
          <Zap className="w-2.5 h-2.5 fill-[#22c55e]" />
          Trade Inmediato
        </div>
      </div>

      {/* Rarity Divider */}
      <div className={`h-[2px] w-full mb-3 rounded-full ${rarityColors[skin.rarity] || 'bg-white/10'} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />

      {/* Price Section */}
      <div className="flex flex-col gap-0.5 mb-4">
        <div className="text-lg font-black text-white tracking-tight leading-none">
          ${skin.price.toLocaleString()} <span className="text-[10px] text-muted ml-0.5">USDT</span>
        </div>
        <div className="text-[9px] font-bold text-muted/60">
          ≈ {(skin.price * 1).toLocaleString()} USD
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 h-10">
        <button 
          className="flex-1 flex items-center justify-center gap-2 bg-accent rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:brightness-110 transition-all active:scale-95 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Comprar
        </button>

        {!isInCart ? (
          <button 
            onClick={() => addToCart(skin)}
            className="w-10 flex items-center justify-center bg-secondary rounded-lg text-white hover:bg-secondary/80 transition-colors border border-white/5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center bg-secondary rounded-lg border border-white/10 overflow-hidden">
            <button 
              onClick={() => updateQuantity(skin.id, -1)}
              className="w-8 h-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white/50 hover:text-white"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-[11px] font-black text-white">{cartItem.quantity}</span>
            <button 
              onClick={() => updateQuantity(skin.id, 1)}
              className="w-8 h-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white/50 hover:text-white"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
