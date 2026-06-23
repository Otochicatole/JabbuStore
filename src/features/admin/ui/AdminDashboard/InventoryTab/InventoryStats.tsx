"use client";

import React from "react";
import { Loader2, Database, TrendingUp, Cpu, CalendarDays } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";

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
      {/* Stat 1: Total Stock */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full group-hover:bg-accent/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              {t("admin.inventory.totalStock")}
            </span>
            <span className="text-3xl font-black block mt-2 tracking-tight">
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin text-white/40" />
              ) : (
                stats.totalItems.toLocaleString()
              )}
            </span>
            <span className="text-[10px] text-[#84849b] block mt-1">
              {t("admin.inventory.syncedItems")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(217,70,239,0.05)]">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stat 2: Inventory Value */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              {t("admin.inventory.totalValue")}
            </span>
            <span className="text-3xl font-black block mt-2 text-green-400 tracking-tight">
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin text-green-400/40" />
              ) : (
                `$${stats.inventoryValue.toLocaleString()}`
              )}
            </span>
            <span className="text-[10px] text-[#84849b] block mt-1">
              {t("admin.inventory.estimatedUsdStock")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.05)]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stat 3: Bots Connected */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              {t("admin.inventory.steamBots")}
            </span>
            <span className="text-3xl font-black block mt-2 text-blue-400 tracking-tight">
              {stats.botsConnected}
            </span>
            <span className="text-[10px] text-[#84849b] block mt-1">
              {t("admin.inventory.activeSyncers")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.05)]">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stat 4: Sync Scheduler */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-2xl rounded-full group-hover:bg-yellow-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Cronjob Sync
            </span>
            <span className="text-lg font-black block mt-3 text-yellow-400 tracking-tight flex items-center gap-1.5 uppercase font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {t("admin.settings.active")}
            </span>
            <span className="text-[10px] text-[#84849b] block mt-2">
              {t("admin.inventory.automaticSync")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-white/[0.02] border border-white/10 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.05)]">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
