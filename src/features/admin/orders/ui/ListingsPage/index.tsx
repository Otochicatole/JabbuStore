"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, Tag } from "lucide-react";
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
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

export function ListingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros interactivos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

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
      if (!response.ok)
        throw new Error(t("admin.sellOrders.loadError"));
      const data: Order[] = await response.json();
      const filtered = data.filter((o) => o.type === "SELL");
      setOrders(filtered);
    } catch (err: unknown) {
      console.error(err);
      setError(getUnknownErrorMessage(err, t("admin.sellOrders.loadError")));
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

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.sellOrders.title")}
        description={t("admin.sellOrders.description")}
        icon={Tag}
        actions={(
          <AdminButton
          onClick={fetchOrders}
          disabled={loadingOrders}
            icon={RefreshCw}
            loading={loadingOrders}
            variant="secondary"
        >
          {t("common.refresh")}
          </AdminButton>
        )}
      />

      {error && (
        <AdminAlert>{error}</AdminAlert>
      )}

      <AdminToolbar>
        <AdminSearchInput
          placeholder={t("admin.sellOrders.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
        />

        <AdminSelect
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full md:w-52"
          options={[
            { value: "all", label: t("admin.common.allStatuses") },
            { value: "PENDING_PAYMENT", label: t("purchases.status.paymentPending") },
            { value: "PAID", label: t("purchases.status.paid") },
            { value: "TRADE_PENDING", label: t("purchases.status.tradePending") },
            { value: "COMPLETED", label: t("purchases.status.completed") },
            { value: "CANCELLED", label: t("purchases.status.cancelled") },
          ]}
        />

        <AdminSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          className="w-full md:w-56"
          options={[
            { value: "all", label: t("admin.common.allMethods") },
            { value: "mercado_pago", label: t("paymentMethod.mercado_pago.name") },
            { value: "paypal", label: "PayPal" },
            { value: "nowpayments", label: t("paymentMethod.nowpayments.name") },
          ]}
        />
      </AdminToolbar>

      {loadingOrders ? (
        <AdminLoadingState />
      ) : (() => {
        const filteredOrders = orders.filter(order => {
          if (searchTerm.trim() !== '') {
            const cleanSearch = searchTerm.toLowerCase().trim();
            const orderIdMatch = order.id.toLowerCase().includes(cleanSearch);
            const userNameMatch = order.user?.name?.toLowerCase().includes(cleanSearch);
            const userSteamIdMatch = order.user?.steamId?.toLowerCase().includes(cleanSearch);
            const itemsMatch = order.items?.some(item => item.name.toLowerCase().includes(cleanSearch) || item.assetId.includes(cleanSearch));
            
            if (!orderIdMatch && !userNameMatch && !userSteamIdMatch && !itemsMatch) {
              return false;
            }
          }

          if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
          }

          if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) {
            return false;
          }

          return true;
        });

        if (filteredOrders.length === 0) {
          return (
            <AdminEmptyState icon={Database} title={t("purchases.noSells")} />
          );
        }

        return (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <AdminOrderListCard
                key={order.id}
                order={order}
                kind="listing"
                onOpen={(orderId) => router.push(`${localizePath("/admin/panel/orders/listing")}?id=${orderId}`)}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
