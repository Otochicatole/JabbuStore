"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketStoreAsset } from "../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

export function useMarketCatalog() {
  const { t } = useI18n();
  const [listings, setListings] = useState<MarketStoreAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("admin.market.syncError"));
      }
      setSyncMessage(
        data.message ||
          t("admin.market.syncStarted"),
      );
      setTimeout(() => {
        fetchListings();
      }, 35000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.market.syncError"));
    } finally {
      setSyncing(false);
    }
  };

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
