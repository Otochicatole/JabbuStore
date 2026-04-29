import Image from 'next/image';
import { Skin } from '../domain/skin';
import { Button } from '@/shared/components/Button';
import { useCart } from '../../cart/context/CartContext';

interface SkinCardProps {
  skin: Skin;
}

const rarityColors: Record<string, string> = {
  common: 'bg-rarity-common',
  uncommon: 'bg-rarity-uncommon',
  rare: 'bg-rarity-rare',
  mythical: 'bg-rarity-mythical',
  legendary: 'bg-rarity-legendary',
  ancient: 'bg-rarity-ancient',
  immortal: 'bg-rarity-immortal',
};

export const SkinCard = ({ skin }: SkinCardProps) => {
  const { addToCart } = useCart();

  return (
    <div className="skin-card group relative flex flex-col overflow-hidden p-3 animate-fade-in border border-white/5 hover:border-[#ff4b4b]/30">
      {/* Rarity Bar (Subtle bottom line like skinswap) */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-full ${rarityColors[skin.rarity] || 'bg-zinc-500'}`} />
      
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-[4px] bg-[#13121d]">
        <Image
          src={skin.imageUrl}
          alt={skin.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 left-2 rounded-[2px] bg-black/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
          {skin.weapon}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="text-[10px] font-bold uppercase tracking-tight text-[#84849b]">{skin.weapon}</h3>
        <h2 className="text-sm font-bold leading-tight text-white line-clamp-1">{skin.name}</h2>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-black text-white">
            ${skin.price.toLocaleString()}
          </span>
          <Button variant="primary" size="sm" onClick={() => addToCart(skin)} className="!h-7 !px-3 !text-[10px]">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};
