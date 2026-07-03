"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Calendar,
  Ticket,
  Gift,
  X,
  Search,
  ExternalLink,
  Package,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminPage,
  AdminSection,
} from "@/features/admin/ui/AdminShell";
import { AdminRaffleCard } from "@/features/admin/raffles/ui/AdminRaffleCard";
import { RaffleAdminWinnersList } from "@/features/admin/raffles/ui/RaffleAdminWinnersList";
import {
  RaffleManageActions,
  type RaffleManageData,
} from "@/features/admin/raffles/ui/RaffleManageActions";
import { AdminSelect } from "@/shared/components/AdminSelect";

interface RafflePrize {
  id: string;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  exterior: string | null;
  float: number | null;
  provider: string;
  winnerId?: string | null;
  winner?: { id: string; name: string | null; steamId: string | null; avatar: string | null; tradeUrl?: string | null } | null;
  winningTicket?: { ticketNumber: number } | null;
}

interface Raffle {
  id: string;
  name: string;
  description: string | null;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  status: string;
  isPublic?: boolean;
  createdAt: string;
  prizes: RafflePrize[];
  tickets: { id: string; status: string; ticketNumber: number; userId: string }[];
}

interface CatalogItem {
  id: string;
  name: string;
  weapon: string;
  price: number;
  imageUrl: string;
  exterior: string | null;
  float: number | null;
  isImmediate: boolean;
}

function getRaffleStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse";
    case "PENDING":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-red-500/10 text-red-400 border-red-500/20";
  }
}

function RafflesAdminContent() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDrawDate, setFormDrawDate] = useState("");
  const [formPrice, setFormPrice] = useState("1.00");
  const [formMaxTickets, setFormMaxTickets] = useState("");
  const [selectedPrizes, setSelectedPrizes] = useState<{item: CatalogItem, position: number}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"bot" | "youpin">("bot");

  const [raffleSearchQuery, setRaffleSearchQuery] = useState("");
  const [raffleStatusFilter, setRaffleStatusFilter] = useState("ALL");

  const fetchRaffles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/all`);
      if (!res.ok) throw new Error(t("raffles.adminTitle"));
      const data = await res.json();
      setRaffles(data);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const isImmediate = pickerTab === "bot";
      const res = await fetchWithAuth(
        `${BACKEND_URL}/catalog/items?limit=50&immediate=${isImmediate}`
      );
      if (res.ok) {
        const data = await res.json();
        setCatalogItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleOpenPicker = () => {
    setIsPickerOpen(true);
    loadCatalog();
  };

  useEffect(() => {
    if (isPickerOpen) loadCatalog();
  }, [pickerTab]);

  const toggleSelectPrize = (item: CatalogItem) => {
    setSelectedPrizes((prev) => {
      const exists = prev.some((p) => p.item.id === item.id);
      return exists ? prev.filter((p) => p.item.id !== item.id) : [...prev, { item, position: 1 }];
    });
  };

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDrawDate || !formPrice) {
      alert(t("raffles.validationRequired") || "Por favor completá los campos obligatorios.");
      return;
    }
    if (selectedPrizes.length === 0) {
      alert(t("raffles.noPrizesSelected") || "Debes seleccionar al menos un premio.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDesc || null,
        drawDate: new Date(formDrawDate).toISOString(),
        ticketPrice: Number(formPrice),
        maxTickets: formMaxTickets ? Number(formMaxTickets) : null,
        prizes: selectedPrizes.map((p) => ({ assetId: p.item.id, position: p.position })),
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al crear.");
      }

      setIsCreateModalOpen(false);
      setFormName("");
      setFormDesc("");
      setFormDrawDate("");
      setFormPrice("1.00");
      setFormMaxTickets("");
      setSelectedPrizes([]);
      fetchRaffles();
    } catch (err: any) {
      alert(err.message || "Error al guardar el sorteo.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalog = catalogItems.filter((item) =>
    `${item.weapon} ${item.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRaffles = raffles.filter((raffle) => {
    const matchesSearch = raffle.name.toLowerCase().includes(raffleSearchQuery.toLowerCase());
    const matchesStatus = raffleStatusFilter === "ALL" || raffle.status === raffleStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("raffles.adminTitle")}
        description={t("raffles.adminDescription") || "Crea, edita, cancela y ejecuta los sorteos del sistema."}
        icon={Gift}
        actions={
          <AdminButton
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
            variant="primary"
          >
            {t("raffles.createRaffle")}
          </AdminButton>
        }
      />

      {/* Filters */}
      {!loading && raffles.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#84849b]" />
            <input
              type="text"
              placeholder={t("admin.searchRaffles") || "Buscar sorteos por nombre..."}
              value={raffleSearchQuery}
              onChange={(e) => setRaffleSearchQuery(e.target.value)}
              className="w-full bg-[#141221] border border-white/5 rounded-[3px] pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent placeholder:text-[#84849b]"
            />
          </div>
          <AdminSelect
            value={raffleStatusFilter}
            onChange={(value) => setRaffleStatusFilter(value)}
            options={[
              { value: "ALL", label: t("admin.allStatuses") || "Todos los estados" },
              { value: "ACTIVE", label: t("admin.statusActive") || "Activo" },
              { value: "PENDING", label: t("admin.statusPending") || "Pendiente" },
              { value: "FINISHED", label: t("admin.statusFinished") || "Finalizado" },
              { value: "CANCELLED", label: t("admin.statusCancelled") || "Cancelado" }
            ]}
          />
        </div>
      )}

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading ? (
        <AdminLoadingState />
      ) : raffles.length === 0 ? (
        <AdminEmptyState
          icon={Gift}
          title={t("raffles.noRaffles")}
          action={
            <AdminButton onClick={() => setIsCreateModalOpen(true)} icon={Plus} variant="primary">
              {t("raffles.createRaffle")}
            </AdminButton>
          }
        />
      ) : filteredRaffles.length === 0 ? (
        <div className="text-center py-10 bg-[#0f0d1e] border border-white/5 rounded-[3px]">
          <p className="text-xs text-[#84849b] font-bold uppercase tracking-wider">
            No se encontraron sorteos con esos filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRaffles.map((raffle) => (
            <AdminRaffleCard 
              key={raffle.id}
              raffle={raffle}
              fetchRaffles={fetchRaffles}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateRaffle}
            className="w-full max-w-2xl bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black uppercase tracking-tight text-white mb-6">
              {t("raffles.createRaffle")}
            </h2>

            <div className="space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.name")}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                    placeholder="ej. Sorteo Cuchillo Mariposa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.adminDrawDate")}
                  </label>
                  <input
                    type="datetime-local"
                    value={formDrawDate}
                    onChange={(e) => setFormDrawDate(e.target.value)}
                    required
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  {t("raffles.desc")}
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent h-20 resize-none"
                  placeholder="Condiciones del sorteo..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.ticketPriceLabel")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.maxTicketsLabel")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxTickets}
                    onChange={(e) => setFormMaxTickets(e.target.value)}
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                    placeholder="Sin límite"
                  />
                </div>
              </div>

              {/* Prizes selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.prizesTitle")} ({selectedPrizes.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenPicker}
                    className="text-xs font-black text-accent hover:text-white uppercase tracking-wider cursor-pointer"
                  >
                    + {t("raffles.selectPrizes")}
                  </button>
                </div>

                {selectedPrizes.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/5 rounded-[3px] bg-white/1">
                    <p className="text-[10px] font-bold text-[#84849b] uppercase tracking-wider">
                      {t("raffles.noPrizesSelected")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-1">
                    {selectedPrizes.map((p) => (
                      <div
                        key={p.item.id}
                        className="flex items-center justify-between p-3 rounded-[3px] bg-[#0b0818] border border-white/5 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.item.imageUrl}
                            alt={p.item.name}
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <span className="text-[10px] font-black text-white uppercase truncate tracking-wide">
                            {p.item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#84849b] uppercase tracking-wider">Puesto</span>
                          <input
                            type="number"
                            min="1"
                            value={p.position}
                            onChange={(e) => {
                              const pos = parseInt(e.target.value) || 1;
                              setSelectedPrizes(prev => prev.map(x => x.item.id === p.item.id ? {...x, position: pos} : x));
                            }}
                            className="w-12 bg-[#141221] border border-white/5 rounded-[3px] px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPrizes((prev) => prev.filter((x) => x.item.id !== p.item.id))
                            }
                            className="text-red-400 hover:text-red-300 cursor-pointer ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-[3px] hover:bg-white/5 text-xs font-bold text-white uppercase tracking-wider cursor-pointer"
              >
                {t("common.cancel") || "Cancelar"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-[3px] bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("raffles.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalog Skins Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative flex flex-col max-h-[85vh] shadow-2xl">
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-tight text-white mb-4">
              {t("raffles.selectPrizes")}
            </h3>

            {/* Picker tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/5 p-1 rounded-[3px] mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setPickerTab("bot")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors cursor-pointer
                  ${pickerTab === "bot" ? "bg-white/5 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                {t("raffles.botSkinsTab") || "Skins de Bot"}
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("youpin")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors cursor-pointer
                  ${pickerTab === "youpin" ? "bg-white/5 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                {t("raffles.youpinSkinsTab") || "Skins de YouPin (Reventa)"}
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("raffles.searchSkins")}
                className="w-full bg-[#141221] border border-white/5 rounded-[3px] pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {loadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-xs text-[#84849b] uppercase font-bold text-center py-8">
                  No se encontraron ítems en stock.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredCatalog.map((item) => {
                    const isSelected = selectedPrizes.some((p) => p.item.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelectPrize(item)}
                        className={`flex items-center justify-between p-3 rounded-[3px] border transition-all text-left w-full cursor-pointer
                          ${isSelected ? "bg-accent/5 border-accent text-white" : "bg-[#0b0818] border-white/5 hover:border-white/10 text-white/80"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block text-[10px] font-black uppercase truncate tracking-wide text-white">
                              {item.weapon} | {item.name}
                            </span>
                            <span className="block text-[8px] font-mono text-[#84849b] uppercase mt-0.5">
                              ID: {item.id}{" "}
                              {item.float ? `· Float: ${item.float.toFixed(4)}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-[10px] font-black">${item.price.toFixed(2)}</span>
                          <span
                            className={`block text-[8px] font-bold uppercase mt-0.5 ${isSelected ? "text-accent" : "text-emerald-400"}`}
                          >
                            {isSelected ? "Seleccionado" : "Click para agregar"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-5 py-2.5 rounded-[3px] bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest cursor-pointer"
              >
                Aceptar ({selectedPrizes.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RafflesAdminPage() {
  return (
    <AdminPage>
      <Suspense fallback={<AdminLoadingState />}>
        <RafflesAdminContent />
      </Suspense>
    </AdminPage>
  );
}
