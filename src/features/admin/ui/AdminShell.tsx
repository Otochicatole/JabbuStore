"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { CurrencyProvider } from "@/features/currency/context/CurrencyContext";

type AdminButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type AdminButtonSize = "sm" | "md";
type AdminBadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const buttonVariants: Record<AdminButtonVariant, string> = {
  primary:
    "bg-accent hover:bg-accent/90 border-accent text-white",
  secondary:
    "bg-[#1c1833] hover:bg-[#252042] border-white/10 text-white",
  success:
    "bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40 text-white",
  danger:
    "bg-rose-500/12 hover:bg-rose-500/20 border-rose-500/25 text-rose-200",
  ghost:
    "bg-transparent hover:bg-white/[0.06] border-transparent text-[#a39db9] hover:text-white",
};

const buttonSizes: Record<AdminButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-xs sm:text-[13px]",
};

const badgeTones: Record<AdminBadgeTone, { wrap: string; dot: string }> = {
  neutral: {
    wrap: "border-white/10 bg-white/[0.04] text-[#b8b2cd]",
    dot: "bg-[#8f89a8]",
  },
  accent: {
    wrap: "border-accent/25 bg-accent/12 text-fuchsia-200",
    dot: "bg-accent",
  },
  success: {
    wrap: "border-emerald-500/25 bg-emerald-500/12 text-emerald-300",
    dot: "bg-emerald-400",
  },
  warning: {
    wrap: "border-amber-500/25 bg-amber-500/12 text-amber-200",
    dot: "bg-amber-400",
  },
  danger: {
    wrap: "border-rose-500/25 bg-rose-500/12 text-rose-300",
    dot: "bg-rose-400",
  },
  info: {
    wrap: "border-sky-500/25 bg-sky-500/12 text-sky-200",
    dot: "bg-sky-400",
  },
};

export function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="min-w-0 text-white">
        <main className="w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1600px] space-y-5">{children}</div>
        </main>
      </div>
    </CurrencyProvider>
  );
}

export function AdminSection({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-white/[0.07] bg-[#141124] ${padded ? "p-4 sm:p-5 lg:p-6" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-accent">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminToolbar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-stretch gap-2.5 rounded-lg border border-white/[0.07] bg-[#141124] p-3 md:flex-row md:items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e88a6]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] pl-9 pr-9 text-xs sm:text-[13px] font-medium text-white outline-none transition-colors placeholder:text-[#746e8d] hover:border-white/15 focus:border-accent/60"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#8e88a6] hover:bg-white/5 hover:text-white cursor-pointer transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function AdminStatusTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = "",
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#141124] p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
              active
                ? "bg-accent text-white font-semibold"
                : "text-[#a39db9] hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
                  active
                    ? "bg-black/25 text-white"
                    : "bg-white/[0.06] text-[#c2bdd6]"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AdminButton({
  children,
  icon: Icon,
  loading = false,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  loading?: boolean;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
}) {
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md border font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}: {
  children: React.ReactNode;
  tone?: AdminBadgeTone;
  dot?: boolean;
  className?: string;
}) {
  const palette = badgeTones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${palette.wrap} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`} />}
      {children}
    </span>
  );
}

export function AdminAlert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "success" | "warning" | "info";
}) {
  const styles = {
    error: "border-rose-500/25 bg-rose-500/10 text-rose-200",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    info: "border-accent/25 bg-accent/10 text-fuchsia-200",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-xs sm:text-[13px] font-medium ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function AdminLoadingState({ label }: { label?: string }) {
  return (
    <AdminSection className="space-y-3" padded>
      <div className="flex items-center gap-2.5 text-xs font-medium text-[#9e98b6]">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        {label && <span>{label}</span>}
      </div>
      <div className="space-y-2.5 animate-pulse">
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="h-14 rounded-md border border-white/[0.04] bg-white/[0.025]"
          />
        ))}
      </div>
    </AdminSection>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <AdminSection className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center" padded={false}>
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#1c1833] text-[#9e98b6]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </AdminSection>
  );
}

export function AdminStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "accent",
  loading = false,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon: LucideIcon;
  tone?: "accent" | "green" | "blue" | "yellow";
  loading?: boolean;
}) {
  const toneClasses = {
    accent: "text-accent bg-accent/10 border-accent/20",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    yellow: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#141124] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9e98b6]">{label}</p>
          <div className="mt-2 min-h-8 text-2xl font-semibold tracking-tight text-white tabular-nums">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-white/40" /> : value}
          </div>
          {description && (
            <p className="mt-1 text-xs text-[#7d7698]">{description}</p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${toneClasses[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full ${widths[size]} flex-col overflow-hidden rounded-xl border border-white/10 bg-[#141124] text-white shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#9e98b6]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[#9e98b6] hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] bg-[#100d1e] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) adjustedEnd = 4;
    else if (currentPage >= totalPages - 2) adjustedStart = totalPages - 3;
    for (let i = adjustedStart; i <= adjustedEnd; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  summary,
  previousLabel,
  nextLabel,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary: string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-[#9e98b6] tabular-nums">{summary}</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-[#1c1833] px-2.5 text-xs font-medium text-white hover:bg-[#252042] disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{previousLabel}</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers(currentPage, totalPages).map((page, idx) => (
            <button
              key={`${page}-${idx}`}
              type="button"
              onClick={() => {
                if (typeof page === "number") onPageChange(page);
              }}
              disabled={page === "..."}
              className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums transition-colors ${
                page === currentPage
                  ? "border-accent bg-accent text-white font-semibold"
                  : page === "..."
                    ? "border-transparent bg-transparent text-[#7d7698] cursor-default"
                    : "border-white/10 bg-[#1c1833] text-[#a39db9] hover:bg-[#252042] hover:text-white cursor-pointer"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-[#1c1833] px-2.5 text-xs font-medium text-white hover:bg-[#252042] disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer transition-colors"
        >
          <span>{nextLabel}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
