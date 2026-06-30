"use client";

import React from "react";
import {
  Plus,
  Loader2,
  Bot as BotIcon,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAdminBots } from "./useAdminBots";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BotModal } from "./BotModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { BotCard } from "./BotCard";

export function AdminBotsPanel() {
  const { t } = useI18n();
  const {
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
    activeBots,
    syncingInventory,
    refreshingCatalog,
    catalogStatus,
    syncMessage,
    syncError,
    handleRefreshPriceCatalog,
    handleSyncInventory,
  } = useAdminBots();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            {t("admin.botManagement")}
          </h2>
          <p className="text-xs text-[#84849b] mt-0.5">
            {t("admin.bots.description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefreshPriceCatalog}
            disabled={refreshingCatalog || Boolean(catalogStatus?.running)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors w-full sm:w-auto cursor-pointer min-h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshingCatalog || catalogStatus?.running ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0" />
            )}
            <span>
              {refreshingCatalog || catalogStatus?.running
                ? t("admin.bots.downloadingCatalog")
                : t("admin.bots.downloadCatalog")}
            </span>
          </button>
          <button
            onClick={handleSyncInventory}
            disabled={syncingInventory || bots.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors w-full sm:w-auto cursor-pointer min-h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingInventory ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0" />
            )}
            <span>
              {syncingInventory
                ? t("admin.bots.syncingInventory")
                : t("admin.bots.syncInventory")}
            </span>
          </button>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors shadow-[0_0_20px_rgba(217,70,239,0.2)] w-full sm:w-auto cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t("admin.bots.newBot")}</span>
          </button>
        </div>
      </div>

      {(syncMessage || syncError) && (
        <div
          className={`rounded-[3px] border px-4 py-3 text-xs font-bold ${
            syncError
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {syncError || syncMessage}
        </div>
      )}

      {catalogStatus && (
        <div className="rounded-[3px] border border-white/10 bg-white/3 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#84849b] break-words">
          {t("admin.bots.priceCatalog")}:{" "}
          <span className="text-white">
            {catalogStatus.itemCount.toLocaleString()} items
          </span>
          {" · "}
          <span className={catalogStatus.running ? "text-sky-400" : catalogStatus.stale ? "text-amber-400" : "text-emerald-400"}>
            {catalogStatus.running
              ? t("admin.bots.catalogDownloading")
              : catalogStatus.exists
              ? catalogStatus.stale
                ? t("admin.bots.catalogStale")
                : t("admin.bots.catalogReady")
              : t("admin.bots.catalogNotDownloaded")}
          </span>
          {catalogStatus.fetchedAt && (
            <>
              {" · "}{t("admin.bots.updated")}{" "}
              <span className="text-white">
                {new Date(catalogStatus.fetchedAt).toLocaleString()}
              </span>
            </>
          )}
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-accent/10 flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">
              {t("admin.bots.totalBots")}
            </p>
            <p className="text-xl font-black">{bots.length}</p>
          </div>
        </div>
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">
              {t("admin.bots.active")}
            </p>
            <p className="text-xl font-black text-emerald-400">{activeBots}</p>
          </div>
        </div>
      </div>

      {/* Bot Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500/80" />
          <p className="text-sm font-black text-white">{t("admin.bots.loadError")}</p>
          <p className="text-xs text-[#84849b]">{error}</p>
          <button
            onClick={fetchBots}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-colors mt-1"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : bots.length === 0 ? (
        <div className="bg-[#110f1e]/20 border border-white/5 rounded-[3px] p-12 text-center">
          <BotIcon className="w-12 h-12 text-[#84849b] mx-auto mb-3" />
          <h3 className="text-sm font-black uppercase tracking-wider mb-1">
            {t("admin.bots.emptyTitle")}
          </h3>
          <p className="text-xs text-[#84849b] max-w-sm mx-auto leading-relaxed mb-6">
            {t("admin.bots.emptyDescription")}
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("admin.bots.registerFirst")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((b) => (
            <BotCard
              key={b.id}
              bot={b}
              actionLoading={actionLoading}
              onEdit={openEdit}
              onDelete={setBotToDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Forms and Deletions Modal Popups */}
      {showModal && (
        <BotModal
          bot={editingBot}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {botToDelete && (
        <DeleteConfirmModal
          bot={botToDelete}
          onClose={() => setBotToDelete(null)}
          onConfirm={() => handleDelete(botToDelete)}
          loading={actionLoading === botToDelete.id}
        />
      )}
    </div>
  );
}
export default AdminBotsPanel;

