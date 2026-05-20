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
    <main className="mx-auto max-w-full px-6 pt-24 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row items-start">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content: Inventory */}
        <section className="flex-1">
          <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Vender <span className="text-accent">Skins</span></h1>
              <p className="text-[#84849b]">Selecciona los items de tu inventario que deseas vender al instante.</p>
            </div>

            {/* Inventory Value Stats */}
            <div className="bg-card border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6 shadow-lg shadow-black/20 font-sans flex-shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Valor Total</p>
                <p className="text-xl font-black text-white tracking-tighter">
                  {loading ? "Calculando..." : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  <span className="text-[10px] text-muted ml-0.5 font-bold"> USDT</span>
                </p>
              </div>
              <div className="h-10 w-[1px] bg-white/5" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Items</p>
                <p className="text-xl font-black text-accent tracking-tighter">
                  {loading ? "..." : inventoryItems.length}
                </p>
              </div>
            </div>
          </header>

          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
              {loading ? "Cargando tu inventario..." : `Tu Inventario (${inventoryItems.length} items)`}
            </span>
            {!loading && (
              <button
                onClick={() => refetchInventory(true)}
                disabled={syncing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-accent/30 text-[10px] font-black uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent group-hover:text-white transition-colors ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Actualizar Inventario'}
              </button>
            )}
          </div>
          
          <InventoryGrid />
        </section>

        {/* Right Panel: Sell List */}
        <aside className="w-full lg:w-80 flex-shrink-0 sticky top-24">
          <SellBasket />
        </aside>
      </div>
    </main>
  );
}

export default function SellPage() {
  return <SellPageContent />;
}
