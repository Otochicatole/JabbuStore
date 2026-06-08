import React from "react";
import Image from "next/image";
import {
  Loader2,
  Database,
  TrendingUp,
  Cpu,
  CalendarDays,
  Tags,
  RefreshCw,
  Search,
  ShieldAlert,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { StoreItem } from "../../domain/types";
import { rarityColors, hashCode } from "./utils";
import { PriceEditModal } from "./PriceEditModal";
import { useInventoryTab } from "./useInventoryTab";

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;

  // Remove Doppler phases
  const phases = [
    " | Phase 1",
    " | Phase 2",
    " | Phase 3",
    " | Phase 4",
    " | Ruby",
    " | Sapphire",
    " | Black Pearl",
    " | Emerald",
  ];
  phases.forEach((p) => {
    name = name.replace(p, "");
  });

  // Remove exteriors
  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
    " | Factory New",
    " | Minimal Wear",
    " | Field-Tested",
    " | Well-Worn",
    " | Battle-Scarred",
    " Factory New",
    " Minimal Wear",
    " Field-Tested",
    " Well-Worn",
    " Battle-Scarred",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });

  // Remove star symbols
  name = name.replace("★ ", "");
  name = name.replace("★", "");

  return name.trim();
}

interface InventoryTabProps {
  initialItems?: StoreItem[];
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) {
      adjustedEnd = 4;
    } else if (currentPage >= totalPages - 2) {
      adjustedStart = totalPages - 3;
    }

    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  return pages;
}

export function InventoryTab({ initialItems = [] }: InventoryTabProps) {
  const {
    loading,
    syncing,
    error,
    search,
    setSearch,
    selectedRarity,
    setSelectedRarity,
    sortBy,
    setSortBy,
    priceModalItem,
    setPriceModalItem,
    stats,
    totalInventoryPages,
    currentInventoryPage,
    visibleInventoryItems,
    handleUpdateItemPrice,
    triggerSync,
    inventoryPage,
    setInventoryPage,
    botMap,
  } = useInventoryTab(initialItems);

  return (
    <div className="space-y-8">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Stock */}
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full group-hover:bg-accent/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                Stock Total
              </span>
              <span className="text-3xl font-black block mt-2 tracking-tight">
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-white/40" />
                ) : (
                  stats.totalItems.toLocaleString()
                )}
              </span>
              <span className="text-[10px] text-[#84849b] block mt-1">
                Artículos Sincronizados
              </span>
            </div>
            <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(217,70,239,0.05)]">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Stat 2: Inventory Value */}
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                Valor Total
              </span>
              <span className="text-3xl font-black block mt-2 text-green-400 tracking-tight">
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-green-400/40" />
                ) : (
                  `$${stats.inventoryValue.toLocaleString()}`
                )}
              </span>
              <span className="text-[10px] text-[#84849b] block mt-1">
                USD Estimados en stock
              </span>
            </div>
            <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.05)]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Stat 3: Bots Connected */}
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                Bots de Steam
              </span>
              <span className="text-3xl font-black block mt-2 text-blue-400 tracking-tight">
                {stats.botsConnected}
              </span>
              <span className="text-[10px] text-[#84849b] block mt-1">
                Sincronizadores activos
              </span>
            </div>
            <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.05)]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Stat 4: Sync Scheduler */}
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-2xl rounded-full group-hover:bg-yellow-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                Cronjob Sync
              </span>
              <span className="text-lg font-black block mt-3 text-yellow-400 tracking-tight flex items-center gap-1.5 uppercase font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Activo
              </span>
              <span className="text-[10px] text-[#84849b] block mt-2">
                Próxima sincronización en ~5m
              </span>
            </div>
            <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.05)]">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Sync Controls and Notifications */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-[3px] bg-[#110f1e]/30 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-[3px] text-[#84849b]">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">
              Servidor de Precios SteamWebAPI
            </p>
            <p className="text-[10px] text-[#84849b] font-medium font-mono">
              Última recarga automática de inventario de Steam exitosa
            </p>
          </div>
        </div>

        <button
          onClick={triggerSync}
          disabled={syncing || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer select-none"
        >
          <RefreshCw
            className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar Stock Manual"}
        </button>
      </div>

      {/* Filters and Inventory List Section */}
      <div className="bg-[#110f1e]/20 border border-white/5 rounded-[3px] p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#84849b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o tipo..."
              className="w-full bg-[#110f1e]/40 border border-white/5 pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-[#84849b] rounded-[3px] outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-[#110f1e]/40 border border-white/5 text-xs font-bold px-4 py-2.5 rounded-[3px] text-white outline-none cursor-pointer"
            >
              <option value="all">Todas las rarezas</option>
              <option value="coverte">★ Covert (Rojo)</option>
              <option value="classified">Classified (Rosado)</option>
              <option value="restricted">Restricted (Púrpura)</option>
              <option value="mil-spec">Mil-Spec (Azul)</option>
              <option value="industrial">Industrial Grade (Celeste)</option>
              <option value="consumer">Consumer Grade (Gris)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#110f1e]/40 border border-white/5 text-xs font-bold px-4 py-2.5 rounded-[3px] text-white outline-none cursor-pointer"
            >
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="float_asc">Float: Menor a Mayor</option>
              <option value="float_desc">Float: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-[3px] text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Items Grid/List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
            <p className="text-[10px] text-[#84849b] font-black uppercase tracking-widest">
              Cargando catálogo del servidor...
            </p>
          </div>
        ) : visibleInventoryItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Database className="w-8 h-8 text-[#84849b] mb-3" />
            <p className="text-xs text-[#84849b] font-bold">
              No se encontraron artículos con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-white/5 rounded-[3px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#110f1e]/40 text-[#84849b] text-[10px] font-black uppercase tracking-wider font-mono">
                      <th className="py-4 px-5">Skin</th>
                      <th className="py-4 px-5">ID de Asset</th>
                      <th className="py-4 px-5">Float Value</th>
                      <th className="py-4 px-5">Bot Dueño</th>
                      <th className="py-4 px-5">Precio</th>
                      <th className="py-4 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {visibleInventoryItems.map((item) => {
                      const color =
                        rarityColors[item.rarity.toLowerCase()] ||
                        rarityColors.common;
                      const botName = botMap[item.botSteamId] || `Bot (${item.botSteamId.slice(-4)})`;

                      return (
                        <tr
                          key={item.assetId}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-3 px-5 flex items-center gap-3">
                            <div
                              className="relative w-12 h-12 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                              style={{ borderColor: `${color}25` }}
                            >
                              <div
                                className="absolute inset-0 blur-md opacity-20 pointer-events-none rounded-[3px]"
                                style={{
                                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                                }}
                              />
                              {item.iconUrl && (
                                <Image
                                  src={item.iconUrl}
                                  alt={item.name}
                                  width={44}
                                  height={44}
                                  className="object-contain z-10"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-white truncate max-w-xs">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-[#84849b] uppercase font-mono mt-0.5">
                                {item.type}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-5 font-mono text-[10px] text-[#84849b]">
                            {item.assetId}
                          </td>
                          <td className="py-3 px-5 font-mono text-[10px]">
                            {item.float !== null &&
                            item.float !== undefined ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold">
                                  {item.float.toFixed(5)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#84849b]">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="font-black text-white text-[10px] uppercase font-mono">
                                {botName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            <span className="font-black text-green-400 font-mono text-sm">
                              ${item.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPriceModalItem(item)}
                                className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-white/60 hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
                                title="Editar Precio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`https://steamcommunity.com/profiles/${item.botSteamId}/inventory/#730`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-[#84849b] hover:text-white transition-all cursor-pointer"
                                title="Ver Inventario del Bot"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalInventoryPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-[10px] text-[#84849b] font-bold uppercase tracking-wider font-mono">
                  Página {currentInventoryPage} de {totalInventoryPages}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setInventoryPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentInventoryPage === 1}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    Anterior
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers(
                      currentInventoryPage,
                      totalInventoryPages,
                    ).map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (typeof page === "number") setInventoryPage(page);
                        }}
                        disabled={page === "..."}
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-[3px] border transition-all cursor-pointer select-none ${
                          page === currentInventoryPage
                            ? "bg-accent border-accent text-white font-black"
                            : "bg-white/[0.02] border-white/5 text-[#84849b] hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setInventoryPage((p) =>
                        Math.min(totalInventoryPages, p + 1),
                      )
                    }
                    disabled={currentInventoryPage === totalInventoryPages}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Edit Modal popup */}
      {priceModalItem && (
        <PriceEditModal
          item={priceModalItem}
          onClose={() => setPriceModalItem(null)}
          onSuccess={handleUpdateItemPrice}
        />
      )}
    </div>
  );
}
