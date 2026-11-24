"use client";

import React from "react";
import { Database, TrendingUp, Cpu, CalendarDays } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminStatCard } from "@/features/admin/ui/AdminShell";

interface InventoryStatsProps {
  stats: {
    totalItems: number;
    inventoryValue: number;
    botsConnected: number;
  };
  loading: boolean;
}

export function InventoryStats({ stats, loading }: InventoryStatsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        label={t("admin.inventory.totalStock")}
        value={stats.totalItems.toLocaleString()}
        description={t("admin.inventory.syncedItems")}
        icon={Database}
        loading={loading}
      />
      <AdminStatCard
        label={t("admin.inventory.totalValue")}
        value={<span className="text-emerald-400">${stats.inventoryValue.toLocaleString()}</span>}
        description={t("admin.inventory.estimatedUsdStock")}
        icon={TrendingUp}
        tone="green"
        loading={loading}
      />
      <AdminStatCard
        label={t("admin.inventory.steamBots")}
        value={<span className="text-sky-400">{stats.botsConnected}</span>}
        description={t("admin.inventory.activeSyncers")}
        icon={Cpu}
        tone="blue"
      />
      <AdminStatCard
        label="Cronjob Sync"
        value={
          <span className="inline-flex items-center gap-2 text-lg font-semibold text-amber-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {t("admin.settings.active")}
          </span>
        }
        description={t("admin.inventory.automaticSync")}
        icon={CalendarDays}
        tone="yellow"
      />
    </div>
  );
}
