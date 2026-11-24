"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option<T> {
  value: T;
  label: string;
}

interface AdminDropdownProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  labelPrefix?: string;
  widthClass?: string;
}

export function AdminDropdown<T extends string>({
  value,
  onChange,
  options,
  labelPrefix,
  widthClass = "min-w-[140px] sm:min-w-[180px]",
}: AdminDropdownProps<T>) {
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
    <div className={`relative z-20 w-full sm:w-auto ${widthClass}`} ref={containerRef}>
      <div className="flex w-full items-center justify-between gap-2 sm:justify-start">
        {labelPrefix && (
          <span className="shrink-0 text-xs font-medium text-[#9e98b6]">
            {labelPrefix}:
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`flex h-9 flex-1 sm:flex-initial w-full items-center justify-between gap-2 rounded-md border px-3 text-left transition-colors cursor-pointer ${
            isOpen
              ? "border-accent bg-[#1a1630]"
              : "border-white/10 bg-[#0d0a18] hover:border-white/20"
          }`}
        >
          <span className="max-w-[160px] truncate text-xs font-medium text-white">
            {selectedLabel}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-accent" : "text-[#8e88a6]"
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[170px] rounded-lg border border-white/10 bg-[#1a1630] py-1 shadow-xl z-30">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                    selected
                      ? "bg-accent/15 text-white font-semibold"
                      : "text-[#b8b2cd] hover:bg-white/[0.06] hover:text-white"
                  }`}
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
