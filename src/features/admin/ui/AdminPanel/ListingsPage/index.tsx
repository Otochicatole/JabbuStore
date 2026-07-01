"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, Tag } from "lucide-react";
import { AdminBotOption, Order } from "../../../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { OrderDetailRow } from "../OrderDetailRow";
import { SellOrderDetailRow } from "../SellOrderDetailRow";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminToolbar,
} from "../../AdminShell";

const STATUS_UPDATE_TIMEOUT_MS = 15000;

function getStatusUpdateErrorMessage(err: unknown, t: (key: string) => string) {
  if (err instanceof DOMException && err.name === "AbortError") {
    return t("admin.common.statusUpdateTimeout");
  }

  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return t("admin.common.statusUpdateConnection");
  }

  return err instanceof Error ? err.message : t("admin.common.statusUpdateError");
}

export function ListingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const updatingStatusRef = useRef<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bots, setBots] = useState<AdminBotOption[]>([]);

  // Filtros interactivos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // State for dynamically resolved historical skin details (floats and patterns)
  const [resolvedItemsMap, setResolvedItemsMap] = useState<
    Record<
      string,
      {
        float: number | null;
        pattern: number | null;
        rarity?: string;
        exterior?: string;
      }
    >
  >({});

  const getUnknownErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const getErrorMessage = async (response: Response, fallback: string) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      return data?.error || data?.message || fallback;
    }

    const text = await response.text().catch(() => "");
    return text || fallback;
  };

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
      resolveMissingItemDetails(filtered);
    } catch (err: unknown) {
      console.error(err);
      setError(getUnknownErrorMessage(err, t("admin.sellOrders.loadError")));
    } finally {
      setLoadingOrders(false);
    }
  };

  const resolveMissingItemDetails = async (ordersList: Order[]) => {
    const missingAssetIds = new Set<string>();
    ordersList.forEach((order) => {
      order.items?.forEach((item) => {
        if (
          (item.float === null || item.float === undefined) &&
          !resolvedItemsMap[item.assetId]
        ) {
          missingAssetIds.add(item.assetId);
        }
      });
    });

    if (missingAssetIds.size === 0) return;

    console.log(
      `[Admin Listings] Resolving missing details for ${missingAssetIds.size} assets...`,
    );

    const fetchPromises = Array.from(missingAssetIds).map(async (assetId) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/admin/marketplace/items/details/${assetId}`,
          {
            headers: {
              "X-Tunnel-Skip-AntiPhishing-Page": "true",
            },
            credentials: "include",
          },
        );
        if (response.ok) {
          const details = await response.json();
          return { assetId, details };
        }
      } catch (err) {
        console.error(`Error resolving details for asset ${assetId}:`, err);
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const newResolutions: Record<
      string,
      {
        float: number | null;
        pattern: number | null;
        rarity?: string;
        exterior?: string;
      }
    > = {};

    results.forEach((res) => {
      if (res && res.details) {
        newResolutions[res.assetId] = {
          float: res.details.float,
          pattern: res.details.pattern,
          rarity: res.details.rarity,
          exterior: res.details.exterior,
        };
      }
    });

    if (Object.keys(newResolutions).length > 0) {
      setResolvedItemsMap((prev) => ({
        ...prev,
        ...newResolutions,
      }));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, botId?: string | null) => {
    if (updatingStatusRef.current.has(orderId)) return;

    // Actualización optimista local en memoria para evitar un parpadeo de recarga de red (sin Loader2)
    const originalOrders = [...orders];
    updatingStatusRef.current.add(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, STATUS_UPDATE_TIMEOUT_MS);

    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ status: newStatus, botId }),
      });
      if (response.status === 401 || response.status === 403) {
        const message = await getErrorMessage(response, t("admin.common.adminSessionExpired"));
        if (response.status === 401) router.push("/admin/login");
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, t("admin.common.statusUpdateError")));
      }

      const updatedOrder: Order = await response.json();
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...updatedOrder,
                user: order.user,
                items: updatedOrder.items ?? order.items,
              }
            : order,
        ),
      );
    } catch (err: unknown) {
      alert(getStatusUpdateErrorMessage(err, t));
      // Revertir si falla
      setOrders(originalOrders);
    } finally {
      window.clearTimeout(timeoutId);
      updatingStatusRef.current.delete(orderId);
    }
  };

  const fetchBots = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/bots`, {
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (err) {
      console.error("Error fetching bots:", err);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchOrders();
      fetchBots();
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
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isSellOrder = order.type === "SELL" || order.type === "sell" || order.type?.toUpperCase() === "SELL";
              
              if (isSellOrder) {
                return (
                  <SellOrderDetailRow
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    resolvedItemsMap={resolvedItemsMap}
                    bots={bots}
                  />
                );
              }

              return (
                <OrderDetailRow 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={updateOrderStatus} 
                  resolvedItemsMap={resolvedItemsMap}
                  bots={bots}
                />
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
