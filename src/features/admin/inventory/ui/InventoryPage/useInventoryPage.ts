"use client";

import { useState, useMemo, useEffect, useCallback, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { StoreItem } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

const ITEMS_PER_INVENTORY_PAGE = 50;

export interface BotBasicInfo {
  id: string;
  name: string;
  steamId: string;
}

export function useInventoryPage(initialItems: StoreItem[] = []) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botsList, setBotsList] = useState<BotBasicInfo[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Filter States
  const [search, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<
    "price_asc" | "price_desc" | "float_asc" | "float_desc"
  >("price_desc");

  // Pagination State for Store Inventory
  const [inventoryPage, setInventoryPage] = useState(1);

  // Price Modal State
  const [priceModalItem, setPriceModalItem] = useState<StoreItem | null>(null);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setInventoryPage(1);
    setSelectedAssetIds(new Set());
  }, []);

  const setInventorySortBy = useCallback((value: "price_asc" | "price_desc" | "float_asc" | "float_desc") => {
    setSortBy(value);
    setInventoryPage(1);
    setSelectedAssetIds(new Set());
  }, []);

  const handleInventoryPageChange = useCallback((value: SetStateAction<number>) => {
    setInventoryPage(value);
    setSelectedAssetIds(new Set());
  }, []);

  const fetchStoreItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/store/items`, {
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(t("admin.inventory.loadItemsError"));
      }
      const data = await response.json();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.inventory.connectionError"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  const fetchBotsList = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/bots`, {
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBotsList(data);
      }
    } catch (err) {
      console.error("Error fetching bots list for mapping:", err);
    }
  }, []);

  // Dynamic fetch on mount if initialItems is empty
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialItems.length === 0) {
        void fetchStoreItems();
      }
      void fetchBotsList();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialItems.length, fetchStoreItems, fetchBotsList]);

  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncSuccess(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/bots/sync`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.inventory.syncError"));
      }
      setSyncSuccess(
        data.message ||
          t("admin.inventory.syncStarted"),
      );
      setTimeout(() => {
        void Promise.all([fetchStoreItems(), fetchBotsList()]);
      }, 90000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.inventory.connectionError"));
    } finally {
      setSyncing(false);
    }
  };

  // Compute Statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const inventoryValue = items.reduce((sum, item) => sum + item.price, 0);
    const uniqueTypes = new Set(items.map((item) => item.name)).size;
    const botsConnected = new Set(items.map((item) => item.botSteamId)).size;

    return {
      totalItems,
      inventoryValue,
      uniqueTypes,
      botsConnected: botsConnected || 2,
    };
  }, [items]);

  // Filter and Sort Items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.type.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "float_asc") return (a.float || 0) - (b.float || 0);
        if (sortBy === "float_desc") return (b.float || 0) - (a.float || 0);
        return 0;
      });
  }, [items, search, sortBy]);

  const totalInventoryPages = Math.ceil(
    filteredItems.length / ITEMS_PER_INVENTORY_PAGE,
  );
  const currentInventoryPage =
    inventoryPage > totalInventoryPages ? 1 : inventoryPage;

  const visibleInventoryItems = useMemo(() => {
    const start = (currentInventoryPage - 1) * ITEMS_PER_INVENTORY_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_INVENTORY_PAGE);
  }, [filteredItems, currentInventoryPage]);

  const handleUpdateItemPrice = (updatedItem: StoreItem) => {
    setItems((prev) =>
      prev.map((item) =>
        item.assetId === updatedItem.assetId ? updatedItem : item,
      ),
    );
  };

  const handleToggleMarketable = async (item: StoreItem, marketable: boolean) => {
    try {
      setError(null);
      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.assetId === item.assetId ? { ...i, marketable } : i
        )
      );

      const response = await fetch(`${BACKEND_URL}/admin/marketplace/store/items/${item.assetId}/marketable`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ marketable }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar visibilidad");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      // Revert state on error
      setItems((prev) =>
        prev.map((i) =>
          i.assetId === item.assetId ? { ...i, marketable: !marketable } : i
        )
      );
    }
  };

  const toggleSelectItem = useCallback((assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedAssetIds((prev) => {
      const pageIds = visibleInventoryItems.map((item) => item.assetId);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [visibleInventoryItems]);

  const selectAllFiltered = useCallback(() => {
    setSelectedAssetIds(new Set(filteredItems.map((item) => item.assetId)));
  }, [filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
  }, []);

  const handleBulkMarketable = async (marketable: boolean) => {
    const assetIds = Array.from(selectedAssetIds);
    if (assetIds.length === 0) return;

    const previousById = new Map(
      items
        .filter((item) => selectedAssetIds.has(item.assetId))
        .map((item) => [item.assetId, item.marketable !== false] as const),
    );

    try {
      setBulkUpdating(true);
      setError(null);
      setSyncSuccess(null);

      setItems((prev) =>
        prev.map((item) =>
          selectedAssetIds.has(item.assetId) ? { ...item, marketable } : item,
        ),
      );

      const response = await fetch(`${BACKEND_URL}/admin/marketplace/store/items/marketable`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ assetIds, marketable }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("admin.inventory.bulkVisibilityError"));
      }

      setSyncSuccess(
        t("admin.inventory.bulkVisibilitySuccess", { count: assetIds.length }),
      );
      setSelectedAssetIds(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.inventory.connectionError"));
      setItems((prev) =>
        prev.map((item) => {
          const previous = previousById.get(item.assetId);
          return previous === undefined ? item : { ...item, marketable: previous };
        }),
      );
    } finally {
      setBulkUpdating(false);
    }
  };

  const allVisibleSelected =
    visibleInventoryItems.length > 0 &&
    visibleInventoryItems.every((item) => selectedAssetIds.has(item.assetId));

  const someVisibleSelected =
    visibleInventoryItems.some((item) => selectedAssetIds.has(item.assetId)) &&
    !allVisibleSelected;

  const botMap = useMemo(() => {
    const map: Record<string, string> = {};
    botsList.forEach((b) => {
      map[b.steamId] = b.name;
    });
    return map;
  }, [botsList]);

  return {
    items,
    setItems,
    loading,
    syncing,
    error,
    syncSuccess,
    search,
    setSearch,
    sortBy,
    setSortBy: setInventorySortBy,
    inventoryPage,
    setInventoryPage: handleInventoryPageChange,
    priceModalItem,
    setPriceModalItem,
    stats,
    filteredItems,
    totalInventoryPages,
    currentInventoryPage,
    visibleInventoryItems,
    handleUpdateItemPrice,
    handleToggleMarketable,
    triggerSync,
    fetchStoreItems,
    botMap,
    selectedAssetIds,
    selectedCount: selectedAssetIds.size,
    bulkUpdating,
    allVisibleSelected,
    someVisibleSelected,
    filteredCount: filteredItems.length,
    toggleSelectItem,
    toggleSelectAllVisible,
    selectAllFiltered,
    clearSelection,
    handleBulkMarketable,
  };
}
