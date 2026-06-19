"use client";

import { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "@/shared/lib/api";

export interface Bot {
  id: string;
  name: string;
  steamId: string;
  tradeUrl: string | null;
  status: "active" | "inactive" | "maintenance" | "full" | "error";
  maxItems: number;
  currentItems: number;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

type PriceCatalogStatus = {
  exists: boolean;
  stale: boolean;
  fetchedAt: string | null;
  itemCount: number;
  pageCount: number;
  currency: string;
  market: string;
  lastError?: string;
  running?: boolean;
  lastStartedAt?: string | null;
  lastFinishedAt?: string | null;
  lastItemCount?: number | null;
  triggeredBy?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useAdminBots() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [botToDelete, setBotToDelete] = useState<Bot | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncingInventory, setSyncingInventory] = useState(false);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<PriceCatalogStatus | null>(null);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/bots`, {
        credentials: "include",
        cache: "no-store",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      if (!res.ok) throw new Error("Error al cargar los bots");
      const data = await res.json();
      setBots(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Error al cargar los bots"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBots();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBots]);

  const handleToggle = async (bot: Bot) => {
    setActionLoading(bot.id);
    try {
      const action = bot.isActive ? "deactivate" : "activate";
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/bots/${bot.id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Error al cambiar estado del bot");
      fetchBots();
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Error al cambiar estado del bot"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bot: Bot) => {
    setActionLoading(bot.id);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/bots/${bot.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al eliminar el bot");
      await fetchBots();
      setBotToDelete(null);
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Error al eliminar el bot"));
    } finally {
      setActionLoading(null);
    }
  };

  const openCreate = () => {
    setEditingBot(null);
    setShowModal(true);
  };
  const openEdit = (bot: Bot) => {
    setEditingBot(bot);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingBot(null);
  };
  const onSaved = () => {
    closeModal();
    fetchBots();
  };

  const fetchCatalogStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/store/prices/catalog/status`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al obtener estado del catálogo");
      }
      setCatalogStatus(data);
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, "Error al obtener estado del catálogo"));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCatalogStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCatalogStatus]);

  const handleRefreshPriceCatalog = async () => {
    setRefreshingCatalog(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/store/prices/catalog/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setCatalogStatus(data.catalog ?? null);
        setSyncError(data.message || "Ya hay una descarga del catálogo en curso.");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Error al descargar catálogo de precios");
      }
      setCatalogStatus(data.catalog ?? null);
      setSyncMessage(data.message || "Descarga del catálogo iniciada en segundo plano.");
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, "Error al descargar catálogo de precios"));
    } finally {
      setRefreshingCatalog(false);
    }
  };

  const handleSyncInventory = async () => {
    setSyncingInventory(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/bots/sync`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar inventario de bots");
      }
      setSyncMessage(
        data.message ||
          "Sincronización iniciada en segundo plano. Esperá 1–3 minutos y refrescá la lista.",
      );
      setTimeout(() => {
        fetchBots();
      }, 90000);
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, "Error al sincronizar inventario de bots"));
    } finally {
      setSyncingInventory(false);
    }
  };

  const totalItems = bots.reduce((sum, b) => sum + b.currentItems, 0);
  const activeBots = bots.filter((b) => b.isActive).length;

  useEffect(() => {
    if (!catalogStatus?.running) return;
    const interval = window.setInterval(() => {
      void fetchCatalogStatus();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [catalogStatus?.running, fetchCatalogStatus]);

  return {
    bots,
    loading,
    error,
    showModal,
    editingBot,
    botToDelete,
    setBotToDelete,
    actionLoading,
    fetchBots,
    handleToggle,
    handleDelete,
    openCreate,
    openEdit,
    closeModal,
    onSaved,
    totalItems,
    activeBots,
    syncingInventory,
    refreshingCatalog,
    catalogStatus,
    syncMessage,
    syncError,
    handleRefreshPriceCatalog,
    handleSyncInventory,
  };
}
