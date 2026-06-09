"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFilters, SortOption } from "@/features/filters/context/FilterContext";

const SORT_OPTIONS: SortOption[] = [
  "Precio: Mayor a Menor",
  "Precio: Menor a Mayor",
  "Float: Menor a Mayor",
  "Float: Mayor a Menor",
  "Más recientes"
];

export const SortDropdown = () => {
  const { sortOption, setSortOption } = useFilters();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-20 w-full sm:w-auto">
      <div className="flex items-center justify-between sm:justify-start gap-2 w-full">
        <span className="text-[9px] sm:text-[10px] font-bold text-[#84849b] uppercase tracking-widest shrink-0">Ordenar por:</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between gap-2 px-3 py-2 bg-card border transition-all duration-300 rounded-lg min-w-[140px] sm:min-w-[180px] max-w-full group cursor-pointer flex-1 sm:flex-initial
            ${isOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/5 hover:border-white/10'}
          `}
        >
          <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">{sortOption}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-accent' : 'group-hover:text-white'}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-full min-w-40 bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-xl"
            >
              <div className="py-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortOption(option);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all
                      ${sortOption === option
                        ? 'bg-accent/10 text-accent border-r-2 border-accent'
                        : 'text-muted hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
