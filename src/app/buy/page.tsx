"use client";

import { useSkins } from "@/features/skins/ui/useSkins";
import { SkinGrid } from "@/features/skins/ui/SkinGrid";
import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { SortDropdown } from "@/features/skins/ui/SortDropdown";

export default function BuyPage() {
  const { skins, loading } = useSkins();

  return (
    <main className="mx-auto max-w-full px-6 pt-24 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row items-start">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content */}
        <section className="flex-1">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mercado</h1>
            <p className="text-[#84849b]">Explora y compra las mejores skins de CS2 disponibles.</p>
          </header>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
              {loading ? "Cargando catálogo..." : `Mostrando ${skins.length} resultados`}
            </span>
            <SortDropdown />
          </div>
          
          <SkinGrid skins={skins} loading={loading} />
        </section>
      </div>
    </main>
  );
}
