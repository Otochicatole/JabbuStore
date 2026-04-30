"use client";

import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Search, ChevronRight } from "lucide-react";

const CATEGORIES = [
  "Cuchillo", "Guantes", "Pistola", "SMG", 
  "Rifle De Asalto", "Rifle Francotirador", "Escopeta", "Ametralladora", 
  "Agente", "Contenedor", "Kit De Música", "Parche", "Pegatina"
];

const CONDITIONS = [
  "De Fábrica",
  "Desgaste Mínimo",
  "Probado En Campo",
  "Bastante Usado",
  "Muy Desgastado"
];


export const FilterSidebar = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [isConditionOpen, setIsConditionOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
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
            className="w-full bg-background brightness-90 border border-white/5 pl-9 pr-3 py-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-[4px]"
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" className="w-full bg-background border border-white/5 p-2 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-[4px]" />
          <span className="text-muted">-</span>
          <input type="number" placeholder="Max" className="w-full bg-background border border-white/5 p-2 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-[4px]" />
        </div>
      </div>

      {/* Estado (Condition) */}
      <div className="border-b border-white/5 pb-2">
        <button 
          onClick={() => setIsConditionOpen(!isConditionOpen)}
          className="w-full flex items-center justify-between mb-2 group text-left cursor-pointer"
        >
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-white/50 transition-colors">Estado</h3>
          <ChevronRight className={`h-3 w-3 text-muted transition-transform duration-200 ${isConditionOpen ? 'rotate-90 text-accent' : ''}`} />
        </button>
        
        {isConditionOpen && (
          <div className="space-y-2 animate-fade-in py-1">
            {CONDITIONS.map((cond) => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => toggleCondition(cond)}
                  className={`
                    relative flex items-center justify-center h-4 w-4 rounded-[2px] border transition-all duration-200
                    ${selectedConditions.includes(cond) 
                      ? 'border-accent bg-accent/10' 
                      : 'border-white/10 bg-background group-hover:border-white/20'
                    }
                  `}
                >
                  <div className={`
                    h-1.5 w-1.5 rounded-full bg-[#ff4b4b] transition-opacity duration-200
                    ${selectedConditions.includes(cond) ? 'opacity-100' : 'opacity-0'}
                  `} />
                </div>
                <span className={`
                  text-[11px] font-bold transition-colors duration-200
                  ${selectedConditions.includes(cond) ? 'text-white' : 'text-[#84849b] group-hover:text-white/70'}
                `}>
                  {cond}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button 
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`
                  relative aspect-square max-h-14 w-full flex flex-col items-center justify-center p-2 rounded-[4px] border transition-all duration-300 group active:scale-95 cursor-pointer
                  ${isSelected 
                    ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(217,70,239,0.25)]' 
                    : 'bg-card border-white/5 hover:brightness-110 hover:border-white/10 hover:-translate-y-0.5'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#ff4b4b] animate-pulse" />
                )}
                <span className={`
                  text-[9px] font-black uppercase text-center leading-tight tracking-tight
                  ${isSelected ? 'text-white' : 'text-[#84849b] group-hover:text-white/70'}
                `}>
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>





      <Button variant="secondary" className="w-full !text-[10px] !h-10">Clear Filters</Button>
    </aside>
  );
};
