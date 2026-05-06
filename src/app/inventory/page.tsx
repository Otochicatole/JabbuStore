"use client";

import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { useInventory } from "@/features/inventory/context/InventoryContext";

function InventoryPageContent() {
  const { inventoryItems, loading } = useInventory();

  const totalValue = inventoryItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="mx-auto max-w-full px-6 pt-24 pb-20 px-80">
      <section>
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mi <span className="text-accent">Inventario</span></h1>
            <p className="text-muted">Gestiona y visualiza tu colección de skins.</p>
          </div>
          <div className="bg-card border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6 shadow-lg shadow-black/20 font-sans">
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

        <div className="mb-6">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Skins en tu posesión</span>
        </div>
        <InventoryGrid variant="simple" />
      </section>
    </main>
  );
}

export default function InventoryPage() {
  return <InventoryPageContent />;
}
