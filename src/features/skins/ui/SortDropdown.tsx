"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  "Precio: Mayor a Menor",
  "Precio: Menor a Mayor",
  "Más recientes",
  "Populares"
];

export const SortDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(SORT_OPTIONS[0]);

  return (
    <div className="relative z-20">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Ordenar por:</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between gap-4 px-4 py-2 bg-card border transition-all duration-300 rounded-lg min-w-[180px] group cursor-pointer
            ${isOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/5 hover:border-white/10'}
          `}
        >
          <span className="text-xs font-black text-white uppercase tracking-tight">{selected}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : 'group-hover:text-white'}`} />
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
              className="absolute right-0 top-full mt-2 w-full min-w-[200px] bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-xl"
            >
              <div className="py-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelected(option);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all
                      ${selected === option 
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
