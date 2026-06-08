"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export function AdminSelect({
  value,
  onChange,
  options,
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || String(value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`w-full sm:w-auto min-w-[140px] sm:min-w-[180px] ${isOpen ? 'relative z-50' : 'relative z-20'}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-3 py-2 bg-[#110f1e]/80 border transition-all duration-300 rounded-lg max-w-full group cursor-pointer flex-1 sm:flex-initial w-full
          ${isOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/5 hover:border-white/10'}
        `}
      >
        <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">
          {selectedLabel}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-accent' : 'group-hover:text-white'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-full min-w-[160px] bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
            >
              <div className="py-2 max-h-64 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all
                      ${value === option.value
                        ? 'bg-accent/10 text-accent border-r-2 border-accent'
                        : 'text-muted hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
