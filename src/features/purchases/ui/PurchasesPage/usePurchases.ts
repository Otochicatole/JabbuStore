"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { Order, SelectedProof } from "@/features/purchases/types";

import {
  getOrdersFetchErrorMessage,
  ORDERS_FETCH_TIMEOUT_MS,
  type PurchaseTab,
} from "./helpers";

export function usePurchases(mode: "buy" | "sell") {
  const { t, locale } = useI18n();
  const isFetchingRef = useRef(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [selectedProof, setSelectedProof] = useState<SelectedProof | null>(null);

  const fetchOrders = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, ORDERS_FETCH_TIMEOUT_MS);

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/orders/me`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const responseMessage = contentType.includes("application/json")
          ? (await res.json().catch(() => null))?.error
          : await res.text().catch(() => "");

        throw new Error(
          responseMessage || t("purchases.error.statusLoadOrders", { status: res.status }),
        );
      }

      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Error fetching orders:", e);
      setError(getOrdersFetchErrorMessage(e, t));
    } finally {
      window.clearTimeout(timeoutId);
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchOrders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        return order.type.toLowerCase() === mode;
      }),
    [mode, orders],
  );

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return {
    error,
    expandedOrders,
    fetchOrders,
    filteredOrders,
    loading,
    locale,
    orders,
    selectedProof,
    setSelectedProof,
    t,
    toggleOrderExpand,
  };
}
