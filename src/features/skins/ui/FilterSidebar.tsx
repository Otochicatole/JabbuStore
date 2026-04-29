"use client";

import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Search, ChevronRight } from "lucide-react";

const WEAPON_CATEGORIES = {
  Knives: ['Bayonet', 'Bowie Knife', 'Butterfly Knife', 'Falchion Knife', 'Flip Knife', 'Gut Knife', 'Huntsman Knife', 'Karambit', 'M9 Bayonet', 'Navaja Knife', 'Nomad Knife', 'Paracord Knife', 'Shadow Daggers', 'Skeleton Knife', 'Stiletto Knife', 'Survival Knife', 'Talon Knife', 'Ursus Knife'],
  Gloves: ['Bloodhound Gloves', 'Driver Gloves', 'Hand Wraps', 'Hydra Gloves', 'Moto Gloves', 'Specialist Gloves', 'Sport Gloves'],
  Pistols: ['Desert Eagle', 'Dual Berettas', 'Five-SeveN', 'Glock-18', 'P2000', 'P250', 'R8 Revolver', 'Tec-9', 'USP-S'],
  Rifles: ['AK-47', 'AUG', 'FAMAS', 'G3SG1', 'Galil AR', 'M4A1-S', 'M4A4', 'SCAR-20', 'SG 553', 'SSG 08', 'AWP'],
  SMGs: ['MAC-10', 'MP5-SD', 'MP7', 'MP9', 'P90', 'PP-Bizon', 'UMP-45'],
  Heavy: ['MAG-7', 'Nova', 'Sawed-Off', 'XM1014', 'M249', 'Negev']
};

export const FilterSidebar = () => {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 space-y-6">
      {/* Search */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full bg-[#1b1a26] border border-white/5 pl-9 pr-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#ff4b4b]/50 transition-colors rounded-[4px]"
          />
        </div>
      </div>

      {/* Category Dropdowns */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Weapons</h3>
        <div className="space-y-1">
          {Object.entries(WEAPON_CATEGORIES).map(([cat, weapons]) => (
            <div key={cat} className="border-b border-white/5 last:border-0">
              <button 
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between py-3 text-left hover:text-white transition-colors group"
              >
                <span className={`text-xs font-bold ${openCategories.includes(cat) ? 'text-white' : 'text-[#84849b]'}`}>{cat}</span>
                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${openCategories.includes(cat) ? 'rotate-90 text-[#ff4b4b]' : 'text-white/20'}`} />
              </button>
              
              {openCategories.includes(cat) && (
                <div className="pb-3 pl-2 space-y-2 animate-fade-in">
                  {weapons.map(weapon => (
                    <label key={weapon} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center h-4 w-4 rounded-[2px] border border-white/10 bg-[#13121d] group-hover:border-[#ff4b4b]/50 transition-colors">
                        <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer" />
                        <div className="h-2 w-2 rounded-[1px] bg-[#ff4b4b] opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[11px] font-bold text-[#84849b] group-hover:text-white transition-colors">{weapon}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rarity */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Rarity</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Ancient', 'Legendary', 'Mythical', 'Rare'].map((rarity) => (
            <div 
              key={rarity} 
              className="bg-[#1b1a26] border border-white/5 p-2 text-center rounded-[4px] cursor-pointer hover:border-[#ff4b4b]/30 transition-colors"
            >
              <span className="text-[10px] font-bold text-white/60 uppercase">{rarity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" className="w-full bg-[#1b1a26] border border-white/5 p-2 text-xs font-bold text-white outline-none rounded-[4px]" />
          <span className="text-white/20">-</span>
          <input type="number" placeholder="Max" className="w-full bg-[#1b1a26] border border-white/5 p-2 text-xs font-bold text-white outline-none rounded-[4px]" />
        </div>
      </div>

      <Button variant="secondary" className="w-full !text-[10px] !h-10">Clear Filters</Button>
    </aside>
  );
};
