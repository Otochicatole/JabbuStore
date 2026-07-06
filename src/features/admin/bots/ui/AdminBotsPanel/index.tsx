"use client";

import React from "react";
import {
  Plus,
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
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminStatCard,
} from "@/features/admin/ui/AdminShell";

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
      <AdminHeader
        title={t("admin.botManagement")}
        description={t("admin.bots.description")}
        actions={(
          <>
            <AdminButton
              onClick={handleRefreshPriceCatalog}
              disabled={refreshingCatalog || Boolean(catalogStatus?.running)}
              icon={RefreshCw}
              loading={refreshingCatalog || Boolean(catalogStatus?.running)}
              variant="success"
            >
              {refreshingCatalog || catalogStatus?.running
                ? t("admin.bots.downloadingCatalog")
                : t("admin.bots.downloadCatalog")}
            </AdminButton>
            <AdminButton
              onClick={handleSyncInventory}
              disabled={syncingInventory || bots.length === 0}
              icon={RefreshCw}
              loading={syncingInventory}
              variant="secondary"
            >
              {syncingInventory
                ? t("admin.bots.syncingInventory")
                : t("admin.bots.syncInventory")}
            </AdminButton>
            <AdminButton onClick={openCreate} icon={Plus} variant="primary">
              {t("admin.bots.newBot")}
            </AdminButton>
          </>
        )}
      />

      {(syncMessage || syncError) && (
        <AdminAlert tone={syncError ? "error" : "success"}>
          {syncError || syncMessage}
        </AdminAlert>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminStatCard
          label={t("admin.bots.totalBots")}
          value={bots.length}
          icon={BotIcon}
        />
        <AdminStatCard
          label={t("admin.bots.active")}
          value={<span className="text-emerald-400">{activeBots}</span>}
          icon={Activity}
          tone="green"
        />
      </div>

      {loading ? (
        <AdminLoadingState />
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
        <AdminEmptyState
          icon={BotIcon}
          title={t("admin.bots.emptyTitle")}
          description={t("admin.bots.emptyDescription")}
          action={(
            <AdminButton onClick={openCreate} icon={Plus} variant="primary">
              {t("admin.bots.registerFirst")}
            </AdminButton>
          )}
        />
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

