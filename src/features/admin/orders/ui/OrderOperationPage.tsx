"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminButton, AdminEmptyState, AdminHeader, AdminLoadingState } from "@/features/admin/ui/AdminShell";
import { OrderDetailRow } from "@/features/admin/orders/ui/OrderDetailRow";
import { SellOrderDetailRow } from "@/features/admin/orders/ui/SellOrderDetailRow";
import type { AdminBotOption, Order } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { useI18n } from "@/shared/i18n/I18nProvider";

const STATUS_UPDATE_TIMEOUT_MS = 15000;

type OperationKind = "purchase" | "listing";
type ResolvedItemsMap = Record<
  string,
  {
    float: number | null;
    pattern: number | null;
    rarity?: string;
    exterior?: string;
  }
>;

interface OrderOperationPageProps {
  kind: OperationKind;
}

function getStatusUpdateErrorMessage(err: unknown, t: (key: string) => string) {
  if (err instanceof DOMException && err.name === "AbortError") {
    return t("admin.common.statusUpdateTimeout");
  }

  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return t("admin.common.statusUpdateConnection");
  }

  return err instanceof Error ? err.message : t("admin.common.statusUpdateError");
}

async function getErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    return data?.error || data?.message || fallback;
  }

  const text = await response.text().catch(() => "");
  return text || fallback;
}

export function OrderOperationPage({ kind }: OrderOperationPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const localizePath = useLocalizedPath();
  const orderId = searchParams.get("id");
  const updatingStatusRef = useRef<Set<string>>(new Set());

  const [order, setOrder] = useState<Order | null>(null);
  const [bots, setBots] = useState<AdminBotOption[]>([]);
  const [resolvedItemsMap, setResolvedItemsMap] = useState<ResolvedItemsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listPath = kind === "purchase" ? "/admin/panel/purchases" : "/admin/panel/listings";
  const expectedType = kind === "purchase" ? "BUY" : "SELL";

  const resolveMissingItemDetails = useCallback(async (targetOrder: Order) => {
    const missingAssetIds = new Set<string>();
    targetOrder.items?.forEach((item) => {
      if ((item.float === null || item.float === undefined) && !resolvedItemsMap[item.assetId]) {
        missingAssetIds.add(item.assetId);
      }
    });

    if (missingAssetIds.size === 0) return;

    const results = await Promise.all(
      Array.from(missingAssetIds).map(async (assetId) => {
        try {
          const response = await fetch(`${BACKEND_URL}/admin/marketplace/items/details/${assetId}`, {
            headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
            credentials: "include",
          });

          if (response.ok) {
            return { assetId, details: await response.json() };
          }
        } catch (err) {
          console.error(`Error resolving details for asset ${assetId}:`, err);
        }

        return null;
      }),
    );

    const next: ResolvedItemsMap = {};
    results.forEach((result) => {
      if (result?.details) {
        next[result.assetId] = {
          float: result.details.float,
          pattern: result.details.pattern,
          rarity: result.details.rarity,
          exterior: result.details.exterior,
        };
      }
    });

    if (Object.keys(next).length > 0) {
      setResolvedItemsMap((prev) => ({ ...prev, ...next }));
    }
  }, [resolvedItemsMap]);

  const fetchBots = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/bots`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        credentials: "include",
      });

      if (response.ok) {
        setBots(await response.json());
      }
    } catch (err) {
      console.error("Error fetching bots:", err);
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/orders/all`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        credentials: "include",
      });

      if (response.status === 401) {
        router.push(localizePath("/admin/login"));
        return;
      }

      if (!response.ok) {
        throw new Error(kind === "purchase" ? t("admin.orders.loadError") : t("admin.sellOrders.loadError"));
      }

      const data = (await response.json()) as Order[];
      const found = data.find((item) => item.id === orderId && item.type?.toUpperCase() === expectedType);

      if (!found) {
        setOrder(null);
        return;
      }

      setOrder(found);
      await resolveMissingItemDetails(found);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("admin.orders.loadError"));
    } finally {
      setLoading(false);
    }
  }, [expectedType, kind, localizePath, orderId, resolveMissingItemDetails, router, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchOrder();
      void fetchBots();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBots, fetchOrder]);

  const updateOrderStatus = async (targetOrderId: string, newStatus: string, botId?: string | null) => {
    if (!order || updatingStatusRef.current.has(targetOrderId)) return;

    const originalOrder = order;
    updatingStatusRef.current.add(targetOrderId);
    setOrder((prev) => (prev ? { ...prev, status: newStatus, botId: botId ?? prev.botId } : prev));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, STATUS_UPDATE_TIMEOUT_MS);

    try {
      const response = await fetch(`${BACKEND_URL}/orders/${targetOrderId}/status`, {
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
        if (response.status === 401) router.push(localizePath("/admin/login"));
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, t("admin.common.statusUpdateError")));
      }

      const updatedOrder = (await response.json()) as Order;
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              ...updatedOrder,
              user: prev.user,
              items: updatedOrder.items ?? prev.items,
            }
          : updatedOrder,
      );
    } catch (err: unknown) {
      alert(getStatusUpdateErrorMessage(err, t));
      setOrder(originalOrder);
    } finally {
      window.clearTimeout(timeoutId);
      updatingStatusRef.current.delete(targetOrderId);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={kind === "purchase" ? t("admin.orders.title") : t("admin.sellOrders.title")}
        description={kind === "purchase" ? t("admin.orders.description") : t("admin.sellOrders.description")}
        actions={
          <>
            <AdminButton type="button" icon={ArrowLeft} variant="secondary" onClick={() => router.push(localizePath(listPath))}>
              Back to list
            </AdminButton>
            <AdminButton type="button" icon={RefreshCw} variant="secondary" loading={loading} onClick={fetchOrder}>
              {t("common.refresh")}
            </AdminButton>
          </>
        }
      />

      {loading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminEmptyState title={error} />
      ) : !orderId ? (
        <AdminEmptyState title="Missing order id" description="Open this page with an order id query parameter." />
      ) : !order ? (
        <AdminEmptyState title="Order not found" description="The requested operation does not exist or belongs to another type." />
      ) : kind === "purchase" ? (
        <OrderDetailRow order={order} onUpdateStatus={updateOrderStatus} resolvedItemsMap={resolvedItemsMap} bots={bots} />
      ) : (
        <SellOrderDetailRow order={order} onUpdateStatus={updateOrderStatus} resolvedItemsMap={resolvedItemsMap} bots={bots} />
      )}
    </div>
  );
}
