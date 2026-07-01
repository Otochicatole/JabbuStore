"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, Hash, RefreshCw, Ticket, Users } from "lucide-react";
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
import {
  RafflePurchaseOrderCard,
  type RafflePurchaseOrder,
} from "@/features/admin/raffles/ui/RafflePurchasesPage/RafflePurchaseOrderCard";

interface RaffleFilterOption {
  id: string;
  name: string;
}

export function RafflePurchasesListPage() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<RafflePurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [raffleFilter, setRaffleFilter] = useState(searchParams.get("raffle") ?? "all");

  useEffect(() => {
    const raffleFromUrl = searchParams.get("raffle");
    if (raffleFromUrl) {
      setRaffleFilter(raffleFromUrl);
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/orders`);
      if (!res.ok) throw new Error("Error al cargar las órdenes.");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const raffleOptions = useMemo<RaffleFilterOption[]>(() => {
    const map = new Map<string, string>();
    for (const order of orders) {
      map.set(order.raffleId, order.raffle.name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    if (raffleFilter !== "all" && order.raffleId !== raffleFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const idMatch = order.id.toLowerCase().includes(q);
      const nameMatch = order.user?.name?.toLowerCase().includes(q);
      const steamMatch = order.user?.steamId?.toLowerCase().includes(q);
      const raffleMatch = order.raffle.name.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !steamMatch && !raffleMatch) return false;
    }

    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const uniqueParticipants = new Set(filteredOrders.map((o) => o.userId)).size;
  const nonCancelled = filteredOrders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue = nonCancelled.reduce((sum, order) => sum + order.totalPrice, 0);
  const avgOrder = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.rafflePurchases.title")}
        description={t("admin.rafflePurchases.description")}
        actions={
          <AdminButton
            onClick={fetchOrders}
            disabled={loading}
            icon={RefreshCw}
            loading={loading}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

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
            value={filteredOrders.reduce((sum, order) => sum + order.ticketsCount, 0)}
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
          placeholder={t("admin.rafflePurchases.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <AdminSelect
          value={raffleFilter}
          onChange={setRaffleFilter}
          className="w-full md:w-56"
          options={[
            { value: "all", label: t("admin.rafflePurchases.allRaffles") },
            ...raffleOptions.map((raffle) => ({ value: raffle.id, label: raffle.name })),
          ]}
        />
        <AdminSelect
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full md:w-48"
          options={[
            { value: "all", label: t("admin.rafflePurchases.allStatuses") },
            { value: "PENDING_PAYMENT", label: t("admin.rafflePurchases.workflowPending") },
            { value: "PAID", label: t("admin.rafflePurchases.workflowPaid") },
            { value: "TRADE_PENDING", label: "Procesando" },
            { value: "COMPLETED", label: t("admin.rafflePurchases.workflowCompleted") },
            { value: "CANCELLED", label: t("admin.rafflePurchases.cancelOrder") },
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
            { value: "manual_transfer", label: "Transferencia" },
          ]}
        />
      </AdminToolbar>

      {loading ? (
        <AdminLoadingState />
      ) : filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={Ticket}
          title={t("admin.rafflePurchases.empty")}
          description={t("admin.rafflePurchases.emptyFiltered")}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <RafflePurchaseOrderCard
              key={order.id}
              order={order}
              detailHref={localizePath(
                `/admin/panel/raffle-purchases/${order.raffleId}/${order.id}`
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
