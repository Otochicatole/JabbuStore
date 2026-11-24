"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, Hash, RefreshCw, Ticket, TicketPlus, Users } from "lucide-react";
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
  AdminStatusTabs,
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
      if (!res.ok) throw new Error(t("admin.rafflePurchases.errorLoadOrders"));
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.rafflePurchases.errorLoadOrders"));
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

  const baseFiltered = useMemo(() => {
    return orders.filter((order) => {
      if (raffleFilter !== "all" && order.raffleId !== raffleFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(q);
        const nameMatch = order.user?.name?.toLowerCase().includes(q);
        const steamMatch = order.user?.steamId?.toLowerCase().includes(q);
        const raffleMatch = order.raffle.name.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !steamMatch && !raffleMatch) return false;
      }
      if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [orders, raffleFilter, searchTerm, paymentFilter]);

  const statusTabs = useMemo(() => {
    const countOf = (st: string) => baseFiltered.filter((o) => o.status === st).length;
    return [
      { value: "all", label: t("admin.rafflePurchases.allStatuses"), count: baseFiltered.length },
      { value: "PENDING_PAYMENT", label: t("admin.rafflePurchases.workflowPending"), count: countOf("PENDING_PAYMENT") },
      { value: "PAID", label: t("admin.rafflePurchases.workflowPaid"), count: countOf("PAID") },
      { value: "TRADE_PENDING", label: t("admin.rafflePurchases.workflowProcessing"), count: countOf("TRADE_PENDING") },
      { value: "COMPLETED", label: t("admin.rafflePurchases.workflowCompleted"), count: countOf("COMPLETED") },
      { value: "CANCELLED", label: t("admin.rafflePurchases.cancelOrder"), count: countOf("CANCELLED") },
    ];
  }, [baseFiltered, t]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return baseFiltered;
    return baseFiltered.filter((o) => o.status === statusFilter);
  }, [baseFiltered, statusFilter]);

  const uniqueParticipants = new Set(filteredOrders.map((o) => o.userId)).size;
  const nonCancelled = filteredOrders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue = nonCancelled.reduce((sum, order) => sum + order.totalPrice, 0);
  const avgOrder = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.rafflePurchases.title")}
        description={t("admin.rafflePurchases.description")}
        icon={TicketPlus}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminStatCard
            label={t("admin.rafflePurchases.revenue")}
            value={<span className="text-emerald-400">${totalRevenue.toFixed(2)}</span>}
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

      <AdminStatusTabs
        items={statusTabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

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
          value={paymentFilter}
          onChange={setPaymentFilter}
          className="w-full md:w-52"
          options={[
            { value: "all", label: t("admin.rafflePurchases.allPayments") },
            { value: "mercado_pago", label: t("paymentMethod.mercado_pago.name") },
            { value: "paypal", label: t("paymentMethod.paypal.name") },
            { value: "nowpayments", label: t("paymentMethod.nowpayments.name") },
            { value: "manual_transfer", label: t("paymentMethod.manual_transfer.name") },
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
        <div className="space-y-2.5">
          {filteredOrders.map((order) => (
            <RafflePurchaseOrderCard
              key={order.id}
              order={order}
              detailHref={localizePath(
                `/admin/panel/raffle-purchases/${order.raffleId}/${order.id}`,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
