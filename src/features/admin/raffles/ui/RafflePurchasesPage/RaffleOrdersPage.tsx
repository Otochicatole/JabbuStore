"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  DollarSign,
  ExternalLink,
  Hash,
  RefreshCw,
  Ticket,
  UserRound,
  Users,
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
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

export interface RaffleOrder {
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

function getOrderStatusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  if (status === "CANCELLED") return "border-red-500/20 bg-red-500/10 text-red-400";
  if (status === "PAID") return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  if (status === "TRADE_PENDING") return "border-purple-500/20 bg-purple-500/10 text-purple-400";
  return "border-orange-500/20 bg-orange-500/10 text-orange-400";
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case "PENDING_PAYMENT": return "Pago pendiente";
    case "PAID": return "Pagado";
    case "TRADE_PENDING": return "Procesando";
    case "COMPLETED": return "Completado";
    case "CANCELLED": return "Cancelado";
    default: return status.replaceAll("_", " ");
  }
}

function RaffleOrderCard({
  order,
  detailHref,
}: {
  order: RaffleOrder;
  detailHref: string;
}) {
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
              {order.user?.name || "Usuario Steam"}
            </p>
            <p className="truncate text-[10px] font-mono text-accent">
              {order.user?.steamId || order.id}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Orden</p>
            <p className="font-mono text-xs font-bold text-white/80">{order.id.slice(0, 8)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Total</p>
            <p className="text-sm font-black text-emerald-400">${order.totalPrice.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Chances</p>
            <p className="text-sm font-black text-white flex items-center gap-1">
              <Ticket className="w-3 h-3 text-accent" />
              {order.ticketsCount}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Estado</p>
            <span
              className={`inline-flex rounded-[3px] border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getOrderStatusTone(order.status)}`}
            >
              {getOrderStatusLabel(order.status)}
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

        {/* Detail link */}
        <Link
          href={detailHref}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Ver
        </Link>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#84849b]">
        <span className="font-mono">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-bold uppercase tracking-wider">{order.paymentMethod || "—"}</span>
      </div>
    </div>
  );
}

interface RaffleOrdersPageProps {
  raffleId: string;
}

export function RaffleOrdersPage({ raffleId }: RaffleOrdersPageProps) {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  const [raffleName, setRaffleName] = useState<string | null>(null);
  const [orders, setOrders] = useState<RaffleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffleId}/orders`);
      if (!res.ok) throw new Error("Error al cargar las órdenes.");
      const data = await res.json();
      setRaffleName(data.raffle?.name ?? null);
      setOrders(data.orders ?? []);
    } catch (err: any) {
      setError(err.message || "Error al cargar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [raffleId]);

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
  const nonCancelled = orders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue = nonCancelled.reduce((s, o) => s + o.totalPrice, 0);
  const avgOrder = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

  return (
    <div className="space-y-6">
      <AdminHeader
        title={raffleName ?? t("admin.rafflePurchases.title")}
        description={t("admin.rafflePurchases.description")}
        actions={
          <>
            <Link
              href={localizePath("/admin/panel/raffle-purchases")}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {t("admin.rafflePurchases.backToRaffles")}
            </Link>
            <AdminButton
              onClick={fetchOrders}
              disabled={loading}
              icon={RefreshCw}
              loading={loading}
              variant="secondary"
            >
              {t("common.refresh")}
            </AdminButton>
          </>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AdminStatCard
            label={t("admin.rafflePurchases.revenue")}
            value={`$${totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            tone="green"
          />
          <AdminStatCard
            label={t("admin.rafflePurchases.chancesLabel")}
            value={orders.reduce((s, o) => s + o.ticketsCount, 0)}
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
            label="Promedio por orden"
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
            { value: "all", label: "Todos los estados" },
            { value: "PENDING_PAYMENT", label: "Pago pendiente" },
            { value: "PAID", label: "Pagado" },
            { value: "TRADE_PENDING", label: "Procesando" },
            { value: "COMPLETED", label: "Completado" },
            { value: "CANCELLED", label: "Cancelado" },
          ]}
        />
        <AdminSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          className="w-full md:w-48"
          options={[
            { value: "all", label: "Todos los métodos" },
            { value: "mercado_pago", label: "Mercado Pago" },
            { value: "paypal", label: "PayPal" },
            { value: "nowpayments", label: "Crypto (NOWPayments)" },
          ]}
        />
      </AdminToolbar>

      {loading ? (
        <AdminLoadingState />
      ) : filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={Ticket}
          title={t("admin.rafflePurchases.empty")}
          description="No hay órdenes de chance que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <RaffleOrderCard
              key={order.id}
              order={order}
              detailHref={localizePath(
                `/admin/panel/raffle-purchases/${raffleId}/${order.id}`
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
