"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import {
  Activity,
  Clock,
  Plus,
  Loader2,
  Gift,
  Ticket,
  X,
  Package,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { toValidationId } from "@/features/cart/domain/cart";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminModal,
  AdminPage,
  AdminSearchInput,
  AdminStatCard,
  AdminStatusTabs,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";
import { AdminRaffleCard } from "@/features/admin/raffles/ui/AdminRaffleCard";

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
  provider?: "bot" | "youpin";
}

function RafflesAdminContent() {
  const { t } = useI18n();

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDrawDate, setFormDrawDate] = useState("");
  const [formPrice, setFormPrice] = useState("1.00");
  const [formMaxTickets, setFormMaxTickets] = useState("");
  const [selectedPrizes, setSelectedPrizes] = useState<{ item: CatalogItem; position: number }[]>([]);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
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
        `${BACKEND_URL}/catalog/items?limit=50&immediate=${isImmediate}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      alert(t("raffles.validationRequired"));
      return;
    }
    if (selectedPrizes.length === 0) {
      alert(t("raffles.noPrizesSelected"));
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
        prizes: selectedPrizes.map((p) => ({
          assetId: toValidationId({
            id: p.item.id,
            provider: p.item.provider,
          } as Parameters<typeof toValidationId>[0]),
          position: p.position,
        })),
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Error al crear.");
      }

      setIsCreateModalOpen(false);
      setFormName("");
      setFormDesc("");
      setFormDrawDate("");
      setFormPrice("1.00");
      setFormMaxTickets("");
      setSelectedPrizes([]);
      fetchRaffles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al guardar el sorteo.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalog = catalogItems.filter((item) =>
    `${item.weapon} ${item.name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const searchFiltered = useMemo(
    () =>
      raffles.filter((raffle) =>
        raffle.name.toLowerCase().includes(raffleSearchQuery.toLowerCase()),
      ),
    [raffles, raffleSearchQuery],
  );

  const statusTabs = useMemo(() => {
    const countOf = (st: string) => searchFiltered.filter((r) => r.status === st).length;
    return [
      { value: "ALL", label: t("admin.allStatuses"), count: searchFiltered.length },
      { value: "ACTIVE", label: t("admin.statusActive"), count: countOf("ACTIVE") },
      { value: "PENDING", label: t("admin.statusPending"), count: countOf("PENDING") },
      { value: "FINISHED", label: t("admin.statusFinished"), count: countOf("FINISHED") },
      { value: "CANCELLED", label: t("admin.statusCancelled"), count: countOf("CANCELLED") },
    ];
  }, [searchFiltered, t]);

  const filteredRaffles = useMemo(() => {
    if (raffleStatusFilter === "ALL") return searchFiltered;
    return searchFiltered.filter((raffle) => raffle.status === raffleStatusFilter);
  }, [searchFiltered, raffleStatusFilter]);

  const summaryStats = useMemo(() => {
    let activeCount = 0;
    let soldChances = 0;
    let totalRevenue = 0;
    for (const r of raffles) {
      if (r.status === "ACTIVE") activeCount += 1;
      const paid = r.tickets?.filter((ticket) => ticket.status === "PAID").length || 0;
      soldChances += paid;
      totalRevenue += paid * r.ticketPrice;
    }
    return {
      total: raffles.length,
      active: activeCount,
      soldChances,
      revenue: totalRevenue,
    };
  }, [raffles]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("raffles.adminTitle")}
        description={t("raffles.adminDescription")}
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

      {!loading && raffles.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <AdminStatCard
              label={t("admin.raffles.kpiTotal")}
              value={summaryStats.total}
              icon={Gift}
              tone="blue"
            />
            <AdminStatCard
              label={t("admin.raffles.kpiActive")}
              value={summaryStats.active}
              icon={Clock}
              tone="accent"
            />
            <AdminStatCard
              label={t("admin.raffles.kpiSoldChances")}
              value={summaryStats.soldChances}
              icon={Ticket}
              tone="yellow"
            />
            <AdminStatCard
              label={t("admin.raffles.revenue")}
              value={`$${summaryStats.revenue.toFixed(2)}`}
              icon={Activity}
              tone="green"
            />
          </div>

          <AdminStatusTabs
            items={statusTabs}
            value={raffleStatusFilter}
            onChange={setRaffleStatusFilter}
          />
          <AdminToolbar>
            <AdminSearchInput
              placeholder={t("admin.searchRaffles")}
              value={raffleSearchQuery}
              onChange={setRaffleSearchQuery}
            />
          </AdminToolbar>
        </>
      )}

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading ? (
        <AdminLoadingState />
      ) : raffles.length === 0 ? (
        <AdminEmptyState
          icon={Gift}
          title={t("raffles.noRaffles")}
          action={
            <AdminButton
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              variant="primary"
            >
              {t("raffles.createRaffle")}
            </AdminButton>
          }
        />
      ) : filteredRaffles.length === 0 ? (
        <AdminEmptyState icon={Gift} title={t("admin.raffles.noRafflesWithFilters")} />
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

      {/* Create Raffle Modal */}
      <AdminModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="lg"
        title={
          <span className="inline-flex items-center gap-2">
            <Gift className="h-4.5 w-4.5 text-accent" />
            <span>{t("raffles.createRaffle")}</span>
          </span>
        }
      >
        <form onSubmit={handleCreateRaffle} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("raffles.name")} *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent"
                placeholder={t("admin.raffles.namePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("raffles.adminDrawDate")} *
              </label>
              <input
                type="datetime-local"
                value={formDrawDate}
                onChange={(e) => setFormDrawDate(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-xs text-white outline-none focus:border-accent [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#b8b2cd]">
              {t("raffles.desc")}
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="h-24 w-full resize-none rounded-md border border-white/10 bg-[#0d0a18] p-3 text-sm text-white outline-none focus:border-accent"
              placeholder={t("admin.raffles.descriptionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("raffles.ticketPriceLabel")} *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8e88a6]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  required
                  className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] pl-7 pr-3 text-sm text-white outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("raffles.maxTicketsLabel")}
              </label>
              <input
                type="number"
                min="1"
                value={formMaxTickets}
                onChange={(e) => setFormMaxTickets(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent"
                placeholder={t("admin.raffles.noLimit")}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white">
                {t("raffles.prizesTitle")} ({selectedPrizes.length})
              </span>
              <AdminButton
                type="button"
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={handleOpenPicker}
              >
                {t("raffles.selectPrizes")}
              </AdminButton>
            </div>

            {selectedPrizes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-[#0e0b1a] p-6 text-center">
                <Package className="mx-auto mb-2 h-6 w-6 text-[#746e8d]" />
                <p className="text-xs text-[#9e98b6]">{t("raffles.noPrizesSelected")}</p>
              </div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {selectedPrizes.map((p) => (
                  <div
                    key={p.item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#1a1630] p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-md border border-white/10 bg-[#0d0a18] p-1">
                        <img
                          src={p.item.imageUrl}
                          alt={p.item.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="truncate text-xs font-semibold text-white">
                        {p.item.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-[#9e98b6]">
                        {t("admin.raffles.position")}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={p.position}
                        onChange={(e) => {
                          const pos = parseInt(e.target.value) || 1;
                          setSelectedPrizes((prev) =>
                            prev.map((x) =>
                              x.item.id === p.item.id ? { ...x, position: pos } : x,
                            ),
                          );
                        }}
                        className="h-8 w-14 rounded-md border border-white/10 bg-[#0d0a18] px-2 text-center text-xs font-semibold text-white outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPrizes((prev) =>
                            prev.filter((x) => x.item.id !== p.item.id),
                          )
                        }
                        className="rounded-md bg-rose-500/15 p-1.5 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t("common.cancel")}
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              loading={isSaving}
              disabled={isSaving}
            >
              {t("raffles.save")}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Catalog Skins Picker Modal */}
      <AdminModal
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        size="lg"
        title={t("raffles.selectPrizes")}
        footer={
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => setIsPickerOpen(false)}
          >
            {t("common.accept")} ({selectedPrizes.length})
          </AdminButton>
        }
      >
        <div className="space-y-4">
          <div className="flex rounded-md border border-white/10 bg-[#0d0a18] p-1">
            <button
              type="button"
              onClick={() => setPickerTab("bot")}
              className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                pickerTab === "bot"
                  ? "bg-accent text-white font-semibold"
                  : "text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("raffles.botSkinsTab")}
            </button>
            <button
              type="button"
              onClick={() => setPickerTab("youpin")}
              className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                pickerTab === "youpin"
                  ? "bg-accent text-white font-semibold"
                  : "text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("raffles.youpinSkinsTab")}
            </button>
          </div>

          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("raffles.searchSkins")}
          />

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {loadingCatalog ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#9e98b6]">
                {t("admin.raffles.noStockItems")}
              </p>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected = selectedPrizes.some((p) => p.item.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelectPrize(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/12 text-white"
                        : "border-white/[0.06] bg-[#1a1630] text-[#d4cfe6] hover:border-white/15"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-9 w-9 shrink-0 object-contain"
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">
                          {item.weapon} | {item.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-[#8e88a6] tabular-nums">
                          ID: {item.id}
                          {item.float ? ` · Float: ${item.float.toFixed(4)}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-xs font-semibold text-white tabular-nums">
                        ${item.price.toFixed(2)}
                      </span>
                      <span
                        className={`mt-0.5 block text-[11px] font-medium ${
                          isSelected ? "text-fuchsia-300" : "text-emerald-400"
                        }`}
                      >
                        {isSelected ? "Seleccionado" : "Agregar"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </AdminModal>
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
