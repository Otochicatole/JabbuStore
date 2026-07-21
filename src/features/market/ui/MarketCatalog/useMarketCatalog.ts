"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketStoreAsset } from "../../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

export function useMarketCatalog() {
  const { t } = useI18n();
  const [listings, setListings] = useState<MarketStoreAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pollingSyncStatus, setPollingSyncStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price_desc" | "price_asc" | "name">(
    "price_desc",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateSortBy = (value: "price_desc" | "price_asc" | "name") => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/market/listings`, {
        credentials: "include",
        cache: "no-store",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json().catch(() => []);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t("admin.market.loadError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchListings, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchListings]);

  const handleSync = async () => {
    setSyncing(true);
    setPollingSyncStatus(false);
    setSyncMessage(null);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/market/sync`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data: unknown = await res.json().catch(() => ({}));
      const record =
        data !== null && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};
      const message =
        typeof record.message === "string" ? record.message : null;
      if (res.status === 409) {
        setSyncMessage(message || t("admin.market.syncBlocked"));
        if (record.blockingJob === "market_assets") {
          setPollingSyncStatus(true);
        } else {
          setSyncing(false);
        }
        return;
      }
      if (!res.ok) {
        throw new Error(
          typeof record.error === "string"
            ? record.error
            : t("admin.market.syncError"),
        );
      }
      setSyncMessage(message || t("admin.market.syncStarted"));
      setPollingSyncStatus(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.market.syncError"));
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!pollingSyncStatus) return;

    let cancelled = false;
    let pollTimer: number | null = null;
    let requestTimer: number | null = null;
    let requestController: AbortController | null = null;
    let consecutiveFailures = 0;

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      pollTimer = window.setTimeout(poll, delayMs);
    };

    const poll = async () => {
      if (cancelled) return;

      requestController = new AbortController();
      let timedOut = false;
      requestTimer = window.setTimeout(() => {
        timedOut = true;
        requestController?.abort();
      }, 10_000);

      try {
        const response = await fetch(`${BACKEND_URL}/market/sync/status`, {
          credentials: "include",
          cache: "no-store",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
          signal: requestController.signal,
        });
        const data: unknown = await response.json().catch(() => ({}));
        const status =
          data !== null && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};

        if (!response.ok) {
          throw new Error(
            typeof status.error === "string"
              ? status.error
              : t("admin.market.syncStatusUnavailable"),
          );
        }

        consecutiveFailures = 0;
        const phase = typeof status.phase === "string" ? status.phase : "idle";
        const statusMessage =
          typeof status.message === "string" ? status.message : null;

        if (phase === "completed") {
          if (statusMessage) setSyncMessage(statusMessage);
          await fetchListings();
          if (!cancelled) {
            setPollingSyncStatus(false);
            setSyncing(false);
          }
          return;
        }

        if (phase === "failed") {
          const failureMessage =
            typeof status.lastError === "string"
              ? status.lastError
              : statusMessage || t("admin.market.syncFailed");
          setError(failureMessage);
          if (!cancelled) {
            setPollingSyncStatus(false);
            setSyncing(false);
          }
          return;
        }

        if (statusMessage) setSyncMessage(statusMessage);
        schedule(2_000);
      } catch (pollError: unknown) {
        if (cancelled) return;
        consecutiveFailures += 1;
        const retryDelay = Math.min(
          30_000,
          2_000 * 2 ** Math.max(0, consecutiveFailures - 1),
        );
        setSyncMessage(
          timedOut
            ? t("admin.market.syncStatusTimeout")
            : pollError instanceof Error
              ? pollError.message
              : t("admin.market.syncStatusUnavailable"),
        );
        schedule(retryDelay);
      } finally {
        if (requestTimer !== null) window.clearTimeout(requestTimer);
        requestTimer = null;
        requestController = null;
      }
    };

    schedule(0);

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearTimeout(pollTimer);
      if (requestTimer !== null) window.clearTimeout(requestTimer);
      requestController?.abort();
    };
  }, [fetchListings, pollingSyncStatus, t]);

  const filtered = listings
    .filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = a.displayPrice ?? a.price;
      const priceB = b.displayPrice ?? b.price;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "price_asc") return priceA - priceB;
      return a.name.localeCompare(b.name);
    });

  const youpinCount = listings.length;

  return {
    listings,
    loading,
    syncing,
    error,
    syncMessage,
    search,
    setSearch: updateSearch,
    sortBy,
    setSortBy: updateSortBy,
    filtered,
    youpinCount,
    handleSync,
    fetchListings,
    currentPage,
    setCurrentPage,
  };
}
