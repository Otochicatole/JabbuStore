"use client";

import React from "react";
import { Database, TrendingUp, Cpu, CalendarDays } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminStatCard } from "../../AdminShell";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <AdminStatCard
        label={t("admin.inventory.totalStock")}
        value={stats.totalItems.toLocaleString()}
        description={t("admin.inventory.syncedItems")}
        icon={Database}
        loading={loading}
      />
      <AdminStatCard
        label={t("admin.inventory.totalValue")}
        value={<span className="text-green-400">${stats.inventoryValue.toLocaleString()}</span>}
        description={t("admin.inventory.estimatedUsdStock")}
        icon={TrendingUp}
        tone="green"
        loading={loading}
      />
      <AdminStatCard
        label={t("admin.inventory.steamBots")}
        value={<span className="text-blue-400">{stats.botsConnected}</span>}
        description={t("admin.inventory.activeSyncers")}
        icon={Cpu}
        tone="blue"
      />
      <AdminStatCard
        label="Cronjob Sync"
        value={
          <span className="flex items-center gap-1.5 text-lg uppercase text-yellow-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
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
