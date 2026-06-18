"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketStoreAsset } from "../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";

export function useMarketCatalog() {
  const [listings, setListings] = useState<MarketStoreAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"price_desc" | "price_asc" | "name">(
    "price_desc",
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rarityFilter, sortBy]);

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
      setError("Error al cargar el catálogo de mercado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
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
        throw new Error(data.error || "Error al sincronizar el catálogo.");
      }
      setSyncMessage(
        data.message ||
          "Sincronización iniciada. Esperá ~30s y refrescá el listado.",
      );
      setTimeout(() => {
        fetchListings();
      }, 35000);
    } catch (err: any) {
      setError(err.message || "Error al sincronizar el catálogo.");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = listings
    .filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (rarityFilter !== "all" && l.rarity !== rarityFilter) return false;
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
    setSearch,
    rarityFilter,
    setRarityFilter,
    sortBy,
    setSortBy,
    filtered,
    youpinCount,
    handleSync,
    fetchListings,
    currentPage,
    setCurrentPage,
  };
}
