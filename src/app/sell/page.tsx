"use client";

import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { InventoryProvider } from "@/features/inventory/context/InventoryContext";
import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { SellBasket } from "@/features/inventory/ui/SellBasket";

export default function SellPage() {
  return (
    <InventoryProvider>
      <main className="mx-auto max-w-full px-6 pt-24 pb-20">
        <div className="flex flex-col gap-10 lg:flex-row items-start">
          {/* Sidebar Placeholder */}
          <div className="hidden lg:block w-64 flex-shrink-0" />
          
          <FilterSidebar />

          {/* Main Content: Inventory */}
          <section className="flex-1">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Vender <span className="text-accent">Skins</span></h1>
              <p className="text-[#84849b]">Selecciona los items de tu inventario que deseas vender al instante.</p>
            </header>

            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Tu Inventario (8 items)</span>
            </div>
            
            <InventoryGrid />
          </section>

          {/* Right Panel: Sell List */}
          <aside className="w-full lg:w-80 flex-shrink-0 sticky top-24">
            <SellBasket />
          </aside>
        </div>
      </main>
    </InventoryProvider>
  );
}
