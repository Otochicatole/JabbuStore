"use client";

import { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

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
  const { t } = useI18n();
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
      if (!res.ok) throw new Error(t("admin.bots.loadError"));
      const data = await res.json();
      setBots(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, t("admin.bots.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBots();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBots]);

  useEffect(() => {
    const checkInitialSyncStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/marketplace/bots/sync/status`, {
          credentials: "include",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.running) {
            setSyncingInventory(true);
          }
        }
      } catch (e) {
        console.error("Error checking initial sync status:", e);
      }
    };
    void checkInitialSyncStatus();
  }, []);

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
      if (!res.ok) throw new Error(t("admin.bots.toggleError"));
      fetchBots();
    } catch (e: unknown) {
      alert(getErrorMessage(e, t("admin.bots.toggleError")));
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
      if (!res.ok) throw new Error(data.error || t("admin.bots.deleteError"));
      await fetchBots();
      setBotToDelete(null);
    } catch (e: unknown) {
      alert(getErrorMessage(e, t("admin.bots.deleteError")));
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
        throw new Error(data.error || t("admin.bots.catalogStatusError"));
      }
      setCatalogStatus(data);
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, t("admin.bots.catalogStatusError")));
    }
  }, [t]);

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
      const returnedCatalog = data.status ?? data.catalog;
      if (res.status === 409) {
        if (returnedCatalog) setCatalogStatus(returnedCatalog);
        setSyncMessage(data.message || t("admin.bots.catalogInProgress"));
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || t("admin.bots.catalogDownloadError"));
      }
      if (returnedCatalog) setCatalogStatus(returnedCatalog);
      setSyncMessage(data.message || t("admin.bots.catalogDownloadStarted"));
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, t("admin.bots.catalogDownloadError")));
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
        throw new Error(data.error || t("admin.inventory.syncError"));
      }
      setSyncMessage(
        data.message ||
          t("admin.bots.syncStarted"),
      );
    } catch (e: unknown) {
      setSyncError(getErrorMessage(e, t("admin.inventory.syncError")));
      setSyncingInventory(false);
    }
  };

  // Poll inventory sync status and updated counts in real-time
  useEffect(() => {
    if (!syncingInventory) return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/marketplace/bots/sync/status`, {
          credentials: "include",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.running) {
            setSyncingInventory(false);
            setSyncMessage(t("admin.bots.syncCompleted") || "Sincronización de inventario completada.");
            void fetchBots();
            return;
          }
        }
        // Fetch bots list to update item counts in real-time
        const botsRes = await fetch(`${BACKEND_URL}/admin/marketplace/bots`, {
          credentials: "include",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (botsRes.ok) {
          const botsData = await botsRes.json();
          setBots(botsData);
        }
      } catch (e) {
        console.error("Error polling sync status:", e);
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [syncingInventory, fetchBots, t]);

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
