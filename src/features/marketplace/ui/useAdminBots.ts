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

export function useAdminBots() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [botToDelete, setBotToDelete] = useState<Bot | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncingInventory, setSyncingInventory] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
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
    } catch (e: any) {
      alert(e.message);
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
      if (!res.ok) throw new Error("Error al eliminar el bot");
      fetchBots();
      setBotToDelete(null);
    } catch (e: any) {
      alert(e.message);
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
      setSyncMessage(data.message || "Sincronización completada.");
      await fetchBots();
    } catch (e: any) {
      setSyncError(e.message);
    } finally {
      setSyncingInventory(false);
    }
  };

  const totalItems = bots.reduce((sum, b) => sum + b.currentItems, 0);
  const activeBots = bots.filter((b) => b.isActive).length;

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
    syncMessage,
    syncError,
    handleSyncInventory,
  };
}
