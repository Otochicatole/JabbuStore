"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, ShoppingBag } from "lucide-react";
import { Order } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { AdminOrderListCard } from "@/features/admin/orders/ui/AdminOrderListCard";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminStatusTabs,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

export function PurchasesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const getUnknownErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/all`, {
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
      });
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) throw new Error(t("admin.orders.loadError"));
      const data: Order[] = await response.json();
      const filtered = data.filter(
        (o) => o.type === "BUY" && !(o.metadata && (o.metadata as Record<string, unknown>).raffleId),
      );
      setOrders(filtered);
    } catch (err: unknown) {
      console.error(err);
      setError(getUnknownErrorMessage(err, t("admin.orders.loadError")));
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const searchAndMethodFiltered = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    return orders.filter((order) => {
      if (cleanSearch !== "") {
        const orderIdMatch = order.id.toLowerCase().includes(cleanSearch);
        const userNameMatch = order.user?.name?.toLowerCase().includes(cleanSearch);
        const userSteamIdMatch = order.user?.steamId?.toLowerCase().includes(cleanSearch);
        const itemsMatch = order.items?.some(
          (item) =>
            item.name.toLowerCase().includes(cleanSearch) ||
            item.assetId.includes(cleanSearch),
        );
        if (!orderIdMatch && !userNameMatch && !userSteamIdMatch && !itemsMatch) {
          return false;
        }
      }
      if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) {
        return false;
      }
      return true;
    });
  }, [orders, searchTerm, paymentFilter]);

  const statusTabs = useMemo(() => {
    const countOf = (st: string) =>
      searchAndMethodFiltered.filter((o) => o.status === st).length;
    return [
      { value: "all", label: t("admin.common.allStatuses"), count: searchAndMethodFiltered.length },
      { value: "PENDING_PAYMENT", label: t("purchases.status.paymentPending"), count: countOf("PENDING_PAYMENT") },
      { value: "PAID", label: t("purchases.status.paid"), count: countOf("PAID") },
      { value: "TRADE_PENDING", label: t("purchases.status.tradePending"), count: countOf("TRADE_PENDING") },
      { value: "COMPLETED", label: t("purchases.status.completed"), count: countOf("COMPLETED") },
      { value: "CANCELLED", label: t("purchases.status.cancelled"), count: countOf("CANCELLED") },
    ];
  }, [searchAndMethodFiltered, t]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return searchAndMethodFiltered;
    return searchAndMethodFiltered.filter((o) => o.status === statusFilter);
  }, [searchAndMethodFiltered, statusFilter]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.orders.title")}
        description={t("admin.orders.description")}
        icon={ShoppingBag}
        actions={
          <AdminButton
            onClick={fetchOrders}
            disabled={loadingOrders}
            icon={RefreshCw}
            loading={loadingOrders}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      <AdminStatusTabs
        items={statusTabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <AdminToolbar>
        <AdminSearchInput
          placeholder={t("admin.orders.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
        />

        <AdminSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          className="w-full md:w-56"
          options={[
            { value: "all", label: t("admin.common.allMethods") },
            { value: "mercado_pago", label: t("paymentMethod.mercado_pago.name") },
            { value: "manual_transfer", label: t("paymentMethod.manual_transfer.name") },
            { value: "paypal", label: "PayPal" },
            { value: "nowpayments", label: t("paymentMethod.nowpayments.name") },
          ]}
        />
      </AdminToolbar>

      {loadingOrders ? (
        <AdminLoadingState />
      ) : filteredOrders.length === 0 ? (
        <AdminEmptyState icon={Database} title={t("purchases.noOrders")} />
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => (
            <AdminOrderListCard
              key={order.id}
              order={order}
              kind="purchase"
              onOpen={(orderId) =>
                router.push(`${localizePath("/admin/panel/orders/purchase")}?id=${orderId}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
