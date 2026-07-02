"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  RefreshCw,
  DollarSign,
  Users,
  Hash,
  ChevronRight,
  UserRound,
  Package,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { AdminSelect } from "@/shared/components/AdminSelect";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface RaffleSummary {
  id: string;
  name: string;
  status: string;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  prizesCount: number;
  soldChances: number;
  pendingChances: number;
  revenue: number;
  ordersCount: number;
  prizes: { iconUrl: string | null; name: string }[];
}

interface RaffleOrder {
  id: string;
  userId: string;
  user: { name: string | null; steamId: string | null; avatar: string | null } | null;
  status: string;
  totalPrice: number;
  paymentMethod: string | null;
  createdAt: string;
  ticketsCount: number;
  raffleTickets: number[];
  metadata: Record<string, any> | null;
  items: { id: string; name: string; iconUrl: string | null; price: number }[];
}

// ── Status helpers ──────────────────────────────────────────────────────────

function getRaffleStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "PENDING":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-red-500/10 text-red-400 border-red-500/20";
  }
}

function getOrderStatusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  if (status === "CANCELLED") return "border-red-500/20 bg-red-500/10 text-red-400";
  if (status === "PAID") return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  if (status === "TRADE_PENDING") return "border-purple-500/20 bg-purple-500/10 text-purple-400";
  return "border-orange-500/20 bg-orange-500/10 text-orange-400";
}

function getOrderStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case "PENDING_PAYMENT": return t("admin.rafflePurchases.statusPendingPayment");
    case "PAID": return t("admin.rafflePurchases.statusPaid");
    case "TRADE_PENDING": return t("admin.rafflePurchases.workflowProcessing");
    case "COMPLETED": return t("admin.rafflePurchases.statusCompleted");
    case "CANCELLED": return t("admin.rafflePurchases.statusCancelled");
    default: return status.replaceAll("_", " ");
  }
}

// ── Raffle card (left pane) ─────────────────────────────────────────────────

function RaffleCard({
  raffle,
  selected,
  onClick,
  t,
}: {
  raffle: RaffleSummary;
  selected: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const pct = raffle.maxTickets
    ? Math.min(100, Math.round((raffle.soldChances / raffle.maxTickets) * 100))
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[3px] border p-4 transition-all ${
        selected
          ? "border-accent/40 bg-accent/5"
          : "border-white/5 bg-[#110f1e]/35 hover:border-white/10 hover:bg-[#110f1e]/55"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-white">{raffle.name}</p>
          <p className="text-[10px] font-mono text-[#84849b] mt-0.5">
            {new Date(raffle.drawDate).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-[3px] border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getRaffleStatusBadge(raffle.status)}`}
        >
          {raffle.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold text-[#84849b] uppercase tracking-wider mb-2">
        <span className="flex items-center gap-1">
          <Ticket className="w-3 h-3" />
          {raffle.soldChances} {raffle.maxTickets ? `/ ${raffle.maxTickets}` : t("raffles.sold")}
        </span>
        <span className="text-emerald-400 font-mono">${raffle.revenue.toFixed(2)}</span>
      </div>

      {raffle.maxTickets ? (
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
          <div
            className="bg-linear-to-r from-accent to-accent/60 h-full rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      {/* Prize thumbnails */}
      {raffle.prizes.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {raffle.prizes.map((p, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden"
              title={p.name}
            >
              {p.iconUrl ? (
                <img src={p.iconUrl} alt={p.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-3 h-3 text-white/20" />
              )}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Order card (right pane) ─────────────────────────────────────────────────

function RaffleOrderCard({ order, t }: { order: RaffleOrder; t: (key: string) => string }) {
  return (
    <div className="rounded-[3px] border border-white/5 bg-[#110f1e]/35 p-4 hover:border-white/10 transition-colors">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* User */}
        <div className="flex min-w-0 items-center gap-3">
          {order.user?.avatar ? (
            <img
              src={order.user.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[3px] border border-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-white/3 text-[#84849b]">
              <UserRound className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              {order.user?.name || t("admin.rafflePurchases.steamUser")}
            </p>
            <p className="truncate text-[10px] font-mono text-accent">
              {order.user?.steamId || order.id}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.rafflePurchases.columnOrder")}</p>
            <p className="font-mono text-xs font-bold text-white/80">{order.id.slice(0, 8)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Total</p>
            <p className="text-sm font-black text-emerald-400">${order.totalPrice.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.rafflePurchases.columnChances")}</p>
            <p className="text-sm font-black text-white flex items-center gap-1">
              <Ticket className="w-3 h-3 text-accent" />
              {order.ticketsCount}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.rafflePurchases.columnStatus")}</p>
            <span
              className={`inline-flex rounded-[3px] border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getOrderStatusTone(order.status)}`}
            >
              {getOrderStatusLabel(order.status, t)}
            </span>
          </div>
        </div>

        {/* Ticket numbers */}
        {order.raffleTickets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 lg:min-w-[140px]">
            {order.raffleTickets.slice(0, 6).map((n) => (
              <span
                key={n}
                className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] font-mono font-black text-accent"
              >
                #{n}
              </span>
            ))}
            {order.raffleTickets.length > 6 && (
              <span className="text-[9px] font-bold text-[#84849b]">
                +{order.raffleTickets.length - 6} más
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#84849b]">
        <span className="font-mono">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-bold uppercase tracking-wider">{order.paymentMethod || "—"}</span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

function RafflePurchasesContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const localizePath = useLocalizedPath();

  const [raffles, setRaffles] = useState<RaffleSummary[]>([]);
  const [loadingRaffles, setLoadingRaffles] = useState(true);
  const [rafflesError, setRafflesError] = useState<string | null>(null);

  const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(
    searchParams.get("raffleId")
  );
  const [orders, setOrders] = useState<RaffleOrder[]>([]);
  const [selectedRaffleName, setSelectedRaffleName] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Fetch raffle summaries
  const fetchRaffles = async () => {
    setLoadingRaffles(true);
    setRafflesError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/summaries`);
      if (!res.ok) throw new Error(t("admin.rafflePurchases.errorLoadRaffles"));
      const data = await res.json();
      setRaffles(data);
    } catch (err: any) {
      setRafflesError(err.message || t("admin.rafflePurchases.errorLoadRaffles"));
    } finally {
      setLoadingRaffles(false);
    }
  };

  // Fetch orders for the selected raffle
  const fetchOrders = async (raffleId: string) => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffleId}/orders`);
      if (!res.ok) throw new Error(t("admin.rafflePurchases.errorLoadOrders"));
      const data = await res.json();
      setSelectedRaffleName(data.raffle?.name ?? null);
      setOrders(data.orders ?? []);
    } catch (err: any) {
      setOrdersError(err.message || t("admin.rafflePurchases.errorLoadOrders"));
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  useEffect(() => {
    if (selectedRaffleId) {
      fetchOrders(selectedRaffleId);
      // Keep URL in sync
      const url = new URL(window.location.href);
      url.searchParams.set("raffleId", selectedRaffleId);
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [selectedRaffleId]);

  // Stats for selected raffle
  const selectedRaffle = raffles.find((r) => r.id === selectedRaffleId);

  const filteredOrders = orders.filter((order) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const idMatch = order.id.toLowerCase().includes(q);
      const nameMatch = order.user?.name?.toLowerCase().includes(q);
      const steamMatch = order.user?.steamId?.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !steamMatch) return false;
    }
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const uniqueParticipants = new Set(orders.map((o) => o.userId)).size;
  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.totalPrice, 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.filter(o => o.status !== "CANCELLED").length : 0;

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.rafflePurchases.title")}
        description={t("admin.rafflePurchases.description")}
        actions={
          <AdminButton
            onClick={fetchRaffles}
            disabled={loadingRaffles}
            icon={RefreshCw}
            loading={loadingRaffles}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      {rafflesError && <AdminAlert>{rafflesError}</AdminAlert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: raffle list */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] px-1">
            {t("admin.rafflePurchases.selectRaffle")}
          </p>
          {loadingRaffles ? (
            <AdminLoadingState />
          ) : raffles.length === 0 ? (
            <AdminEmptyState title={t("admin.rafflePurchases.noRaffles")} />
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {raffles.map((r) => (
                <RaffleCard
                  key={r.id}
                  raffle={r}
                  selected={selectedRaffleId === r.id}
                  onClick={() => setSelectedRaffleId(r.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: orders detail */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedRaffleId ? (
            <AdminSection className="flex min-h-64 flex-col items-center justify-center text-center">
              <ChevronRight className="w-8 h-8 text-[#84849b] mb-3" />
              <p className="text-sm font-black text-white">{t("admin.rafflePurchases.selectRaffle")}</p>
              <p className="text-xs text-[#84849b] mt-1">
                {t("admin.rafflePurchases.selectRaffleHint")}
              </p>
            </AdminSection>
          ) : (
            <>
              {/* Stats */}
              {selectedRaffle && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AdminStatCard
                    label={t("admin.rafflePurchases.revenue")}
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    tone="green"
                  />
                  <AdminStatCard
                    label={t("admin.rafflePurchases.chancesLabel")}
                    value={selectedRaffle.soldChances}
                    icon={Ticket}
                    tone="accent"
                  />
                  <AdminStatCard
                    label={t("admin.rafflePurchases.participants")}
                    value={uniqueParticipants}
                    icon={Users}
                    tone="blue"
                  />
                  <AdminStatCard
                    label={t("admin.rafflePurchases.avgOrder")}
                    value={`$${isFinite(avgOrder) ? avgOrder.toFixed(2) : "0.00"}`}
                    icon={Hash}
                    tone="yellow"
                  />
                </div>
              )}

              <AdminToolbar>
                <AdminSearchInput
                  placeholder="Buscar por usuario, Steam ID u orden..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
                <AdminSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full md:w-48"
                  options={[
                    { value: "all", label: t("admin.rafflePurchases.allStatuses") },
                    { value: "PENDING_PAYMENT", label: t("admin.rafflePurchases.statusPendingPayment") },
                    { value: "PAID", label: t("admin.rafflePurchases.statusPaid") },
                    { value: "TRADE_PENDING", label: t("admin.rafflePurchases.workflowProcessing") },
                    { value: "COMPLETED", label: t("admin.rafflePurchases.statusCompleted") },
                    { value: "CANCELLED", label: t("admin.rafflePurchases.statusCancelled") },
                  ]}
                />
                <AdminSelect
                  value={paymentFilter}
                  onChange={setPaymentFilter}
                  className="w-full md:w-48"
                  options={[
                    { value: "all", label: t("admin.rafflePurchases.allPayments") },
                    { value: "mercado_pago", label: "Mercado Pago" },
                    { value: "paypal", label: "PayPal" },
                    { value: "nowpayments", label: "Crypto (NOWPayments)" },
                  ]}
                />
                {selectedRaffleId && (
                  <AdminButton
                    onClick={() => fetchOrders(selectedRaffleId)}
                    disabled={loadingOrders}
                    icon={RefreshCw}
                    loading={loadingOrders}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {t("common.refresh")}
                  </AdminButton>
                )}
              </AdminToolbar>

              {ordersError && <AdminAlert>{ordersError}</AdminAlert>}

              {loadingOrders ? (
                <AdminLoadingState />
              ) : filteredOrders.length === 0 ? (
                <AdminEmptyState
                  icon={Ticket}
                  title={t("admin.rafflePurchases.empty")}
                  description={t("admin.rafflePurchases.selectRaffleHint")}
                />
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <RaffleOrderCard key={order.id} order={order} t={t} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RafflePurchasesPage() {
  return (
    <Suspense fallback={<AdminLoadingState />}>
      <RafflePurchasesContent />
    </Suspense>
  );
}
