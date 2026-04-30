"use client";

import { SkinGrid } from "@/features/skins/ui/SkinGrid";
import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";

export default function BuyPage() {
  return (
    <main className="mx-auto max-w-full px-6 pt-24 pb-20">
            <div className="flex flex-col gap-10 lg:flex-row items-start">
              {/* Sidebar Placeholder */}
              <div className="hidden lg:block w-64 flex-shrink-0" />
              
              <FilterSidebar />

              {/* Main Content */}
              <section className="flex-1">
                <header className="mb-8">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Marketplace</h1>
                  <p className="text-[#84849b]">Browse and buy the best CS2 skins available.</p>
                </header>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Showing 5 results</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/40 uppercase">Sort by:</span>
                    <select className="bg-[#1b1a26] border border-white/5 px-3 py-1.5 text-xs font-bold text-white outline-none rounded-[4px] cursor-pointer">
                      <option>Price: High to Low</option>
                      <option>Price: Low to High</option>
                      <option>Newest</option>
                    </select>
                  </div>
                </div>
                
                <SkinGrid />
              </section>
            </div>
        </main>
  );
}
