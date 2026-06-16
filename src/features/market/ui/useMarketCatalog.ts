"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketListing } from "../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";

export function useMarketCatalog() {
  const [listings, setListings] = useState<MarketListing[]>([]);
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, rarityFilter, sortBy]);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/market/listings`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
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
    try {
      const res = await fetch(`${BACKEND_URL}/market/sync`, { method: "POST" });
      const data = await res.json();
      setSyncMessage(data.message || "Sincronización completada.");
      await fetchListings();
    } catch {
      setSyncMessage("Error al sincronizar el catálogo.");
    } finally {
      setSyncing(false);
    }
  };

  // Filtrar y ordenar (el proveedor siempre es youpin)
  const filtered = listings
    .filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (rarityFilter !== "all" && l.rarity !== rarityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "price_asc") return a.price - b.price;
      return a.name.localeCompare(b.name);
    });

  const youpinCount = listings.filter((l) => l.provider === "youpin").length;

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
