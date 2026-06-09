"use client";

import { useMemo } from "react";
import { useSkins } from "@/features/skins/ui/useSkins";
import { SkinGrid } from "@/features/skins/ui/SkinGrid";
import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { SortDropdown } from "@/features/skins/ui/SortDropdown";
import { useFilters } from "@/features/filters/context/FilterContext";
import { applyFilters } from "@/features/filters/utils/applyFilters";

export default function BuyPage() {
  const { skins, loading, error, refetch } = useSkins();
  const filters = useFilters();
  const filteredCount = useMemo(() => applyFilters(skins, filters).length, [skins, filters]);

  return (
    <main className="mx-auto max-w-full px-4 sm:px-6 pt-24 pb-20 overflow-x-hidden">
      <div className="flex flex-col gap-6 lg:flex-row items-start overflow-x-hidden">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content */}
        <section className="flex flex-col w-full">
          <header className="mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter">Mercado</h1>
            <p className="text-xs sm:text-sm text-[#84849b] mt-0.5">Explora y compra las mejores skins de CS2 disponibles.</p>
          </header>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-white/5 p-3 rounded-[3px]">
            <span className="text-[10px] sm:text-xs font-bold text-[#84849b] uppercase tracking-widest block sm:inline">
              {loading ? "Cargando catálogo..." : `${filteredCount} Resultados`}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[9px] font-black uppercase text-[#84849b] tracking-wider">Ordenar por:</span>
              <SortDropdown />
            </div>
          </div>
          
          <SkinGrid skins={skins} loading={loading} error={error} onRetry={refetch} />
        </section>
      </div>
    </main>
  );
}
