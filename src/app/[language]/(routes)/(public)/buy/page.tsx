"use client";

import { Suspense } from "react";
import { useSkins } from "@/features/skins/ui/useSkins";
import { SkinGrid } from "@/features/skins/ui/SkinGrid";
import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { SortDropdown } from "@/features/skins/ui/SortDropdown";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Loader2 } from "lucide-react";

function ExpressPageContent() {
  const { skins, pagination, loading, error, refetch } = useSkins("express");
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-full px-4 sm:px-6 pt-24 pb-20 overflow-x-hidden">
      <div className="flex flex-col gap-6 lg:flex-row items-start overflow-x-hidden">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content */}
        <section className="flex flex-col w-full">
          <header className="mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter">{t("express.title")}</h1>
            <p className="text-xs sm:text-sm text-[#84849b] mt-0.5">{t("express.description")}</p>
          </header>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-white/5 p-3 rounded-[3px]">
            <span className="text-[10px] sm:text-xs font-bold text-[#84849b] uppercase tracking-widest block sm:inline">
              {loading ? t("express.loadingCatalog") : t("express.results", { count: pagination.total })}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[9px] font-black uppercase text-[#84849b] tracking-wider">{t("filters.sort")}:</span>
              <SortDropdown />
            </div>
          </div>
          
          <SkinGrid skins={skins} pagination={pagination} loading={loading} error={error} onRetry={refetch} />
        </section>
      </div>
    </main>
  );
}

export default function ExpressPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen pt-28 text-white font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">Cargando...</p>
      </div>
    }>
      <ExpressPageContent />
    </Suspense>
  );
}
