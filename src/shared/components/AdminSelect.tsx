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
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}

export function AdminSelect({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  className,
  buttonClassName,
  menuClassName,
  optionClassName,
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
    <div className={`${className || "w-full sm:w-auto min-w-0 sm:min-w-[180px]"} min-w-0 ${isOpen ? 'relative z-50' : 'relative z-20'}`} ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName
            ? `${buttonClassName} ${isOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : ''} ${disabled ? 'cursor-wait opacity-50' : ''}`
            : `flex h-10 min-w-0 items-center justify-between gap-2 px-3 py-2 bg-white/[0.025] border transition-all duration-300 rounded-[3px] max-w-full group cursor-pointer flex-1 sm:flex-initial w-full ${
                isOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/5 hover:border-white/10'
              } ${disabled ? 'cursor-wait opacity-50' : ''}`
        }
      >
        <span className={buttonClassName ? "truncate min-w-0 text-left" : "min-w-0 text-[10px] sm:text-xs font-black text-white uppercase tracking-tight truncate max-w-[180px]"}>
          {selectedLabel}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-accent' : 'group-hover:text-white'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              role="listbox"
              aria-label={ariaLabel}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={
                menuClassName ||
                "absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full min-w-0 sm:min-w-[180px] bg-card border border-white/10 rounded-[3px] overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
              }
            >
              <div className="py-2 max-h-64 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={
                      optionClassName
                        ? `${optionClassName} ${value === option.value ? 'bg-accent/10 text-accent' : 'text-white/60 hover:text-white hover:bg-white/5'}`
                        : `w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all ${
                            value === option.value
                              ? 'bg-accent/10 text-accent border-r-2 border-accent'
                              : 'text-muted hover:bg-white/5 hover:text-white'
                          }`
                    }
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
