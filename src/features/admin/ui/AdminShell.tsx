"use client";

import React from "react";
import { Loader2, Search, type LucideIcon } from "lucide-react";

type AdminButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

const buttonVariants: Record<AdminButtonVariant, string> = {
  primary:
    "bg-accent hover:bg-accent/90 border-accent/50 text-white shadow-[0_8px_24px_rgba(217,70,239,0.18)]",
  secondary:
    "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 text-white",
  success:
    "bg-emerald-600 hover:bg-emerald-500 border-emerald-400/20 text-white shadow-[0_8px_24px_rgba(16,185,129,0.14)]",
  danger:
    "bg-red-500/10 hover:bg-red-500/15 border-red-500/20 text-red-300",
  ghost:
    "bg-transparent hover:bg-white/[0.04] border-white/5 text-[#84849b] hover:text-white",
};

export function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <main className="w-full min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1680px] space-y-6">{children}</div>
      </main>
    </div>
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
      className={`rounded-[3px] border border-white/5 bg-[#110f1e]/35 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${padded ? "p-4 sm:p-5 lg:p-6" : ""} ${className}`}
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
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-accent/15 bg-accent/10 text-accent">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h2 className="min-w-0 truncate text-lg font-black tracking-tight text-white sm:text-xl">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#84849b]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>}
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
      className={`flex min-w-0 flex-col items-stretch gap-3 rounded-[3px] border border-white/5 bg-[#110f1e]/45 p-3 sm:p-4 md:flex-row md:items-center ${className}`}
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
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#84849b]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[3px] border border-white/10 bg-white/[0.025] pl-10 pr-4 text-xs font-bold text-white outline-none transition-all placeholder:text-white/25 hover:bg-white/[0.04] focus:border-accent/40 focus:bg-[#0f0d1e]"
      />
    </div>
  );
}

export function AdminButton({
  children,
  icon: Icon,
  loading = false,
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  loading?: boolean;
  variant?: AdminButtonVariant;
}) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[3px] border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${buttonVariants[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </button>
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
    error: "border-red-500/20 bg-red-500/10 text-red-400",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    info: "border-accent/20 bg-accent/10 text-accent",
  };

  return (
    <div className={`rounded-[3px] border px-4 py-3 text-xs font-bold ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function AdminLoadingState({ label }: { label?: string }) {
  return (
    <AdminSection className="flex min-h-64 flex-col items-center justify-center" padded={false}>
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-accent" />
      {label && (
        <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
          {label}
        </p>
      )}
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
    <AdminSection className="flex min-h-64 flex-col items-center justify-center text-center" padded={false}>
      {Icon && <Icon className="mb-3 h-9 w-9 text-[#84849b]" />}
      <p className="text-sm font-black text-white">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-xs font-medium leading-relaxed text-[#84849b]">
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
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <div className="relative overflow-hidden rounded-[3px] border border-white/5 bg-[#110f1e]/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
            {label}
          </p>
          <div className="mt-2 min-h-9 text-2xl font-black tracking-tight text-white">
            {loading ? <Loader2 className="h-7 w-7 animate-spin text-white/40" /> : value}
          </div>
          {description && (
            <p className="mt-1 text-[10px] font-medium text-[#84849b]">{description}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
