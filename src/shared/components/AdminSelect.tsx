"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`${className || "w-full sm:w-auto min-w-0 sm:min-w-[180px]"} min-w-0 ${isOpen ? "relative z-50" : "relative z-20"}`}
      ref={containerRef}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          buttonClassName
            ? `${buttonClassName} ${isOpen ? "border-accent" : ""} ${disabled ? "cursor-wait opacity-50" : ""}`
            : `flex h-9 min-w-0 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                isOpen
                  ? "border-accent bg-[#1a1630]"
                  : "border-white/10 bg-[#0d0a18] hover:border-white/20"
              } ${disabled ? "cursor-wait opacity-50" : ""}`
        }
      >
        <span
          className={
            buttonClassName
              ? "truncate min-w-0 text-left"
              : "min-w-0 truncate text-xs sm:text-[13px] font-medium text-white"
          }
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-accent" : "text-[#8e88a6]"
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={
            menuClassName ||
            "absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full min-w-[190px] rounded-lg border border-white/10 bg-[#1a1630] py-1 shadow-xl z-40"
          }
        >
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={
                    optionClassName
                      ? `${optionClassName} ${selected ? "bg-accent/15 text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`
                      : `flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? "bg-accent/15 text-white font-semibold"
                            : "text-[#b8b2cd] hover:bg-white/[0.06] hover:text-white"
                        }`
                  }
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
