"use client";

import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { useInventory } from "@/features/inventory/context/InventoryContext";
import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { SellBasket } from "@/features/inventory/ui/SellBasket";
import { RefreshCw } from "lucide-react";

function SellPageContent() {
  const { inventoryItems, loading, syncing, refetchInventory } = useInventory();

  const totalValue = inventoryItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="mx-auto max-w-full px-4 sm:px-6 pt-24 pb-20 overflow-x-hidden">
      <div className="flex flex-col gap-6 lg:flex-row items-start overflow-x-hidden">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content: Inventory */}
        <section className="w-full min-w-0 flex-1">
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter">
                Vender <span className="text-accent">Skins</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#84849b] mt-0.5">Selecciona los items de tu inventario que deseas vender al instante.</p>
            </div>

            {/* Inventory Value Stats */}
            <div className="bg-card border border-white/5 p-3 px-4 sm:px-6 rounded-[3px] flex items-center gap-4 sm:gap-6 shadow-lg shadow-black/20 font-sans w-full md:w-auto justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-[9px] sm:text-[10px] font-bold text-[#84849b] uppercase tracking-widest mb-1">Valor Total</p>
                <p className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tighter">
                  {loading ? "Calculando..." : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  <span className="text-[9px] sm:text-[10px] text-muted ml-0.5 font-bold"> USD</span>
                </p>
              </div>
              <div className="h-8 sm:h-10 w-[1px] bg-white/5" />
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-bold text-[#84849b] uppercase tracking-widest mb-1">Items</p>
                <p className="text-base sm:text-lg lg:text-xl font-black text-accent tracking-tighter">
                  {loading ? "..." : inventoryItems.length}
                </p>
              </div>
            </div>
          </header>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-white/5 p-3 rounded-[3px]">
            <span className="text-[10px] sm:text-xs font-bold text-[#84849b] uppercase tracking-widest">
              {loading ? "Cargando tu inventario..." : `Tu Inventario (${inventoryItems.length} items)`}
            </span>
            {!loading && (
              <button
                onClick={() => refetchInventory(true)}
                disabled={syncing}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-[3px] bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-accent/30 text-[9.5px] font-black uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer w-full sm:w-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent group-hover:text-white transition-colors ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Actualizar Inventario'}
              </button>
            )}
          </div>
          
          <InventoryGrid />
        </section>

        {/* Right Panel: Sell List */}
        <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
          <SellBasket />
        </aside>
      </div>
    </main>
  );
}

export default function SellPage() {
  return <SellPageContent />;
}
