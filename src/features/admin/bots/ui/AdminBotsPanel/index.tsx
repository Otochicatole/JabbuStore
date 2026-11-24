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
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSection,
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
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.botManagement")}
        description={t("admin.bots.description")}
        icon={BotIcon}
        actions={
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
        }
      />

      {(syncMessage || syncError) && (
        <AdminAlert tone={syncError ? "error" : "success"}>
          {syncError || syncMessage}
        </AdminAlert>
      )}

      {catalogStatus && (
        <AdminSection className="flex flex-wrap items-center gap-3 py-3!">
          <span className="text-xs font-medium text-[#9e98b6]">
            {t("admin.bots.priceCatalog")}:
          </span>
          <span className="text-xs font-semibold text-white tabular-nums">
            {t("admin.bots.itemsCount", { count: catalogStatus.itemCount.toLocaleString() })}
          </span>
          <AdminBadge
            tone={
              catalogStatus.running
                ? "info"
                : catalogStatus.exists
                  ? catalogStatus.stale
                    ? "warning"
                    : "success"
                  : "neutral"
            }
          >
            {catalogStatus.running
              ? t("admin.bots.catalogDownloading")
              : catalogStatus.exists
                ? catalogStatus.stale
                  ? t("admin.bots.catalogStale")
                  : t("admin.bots.catalogReady")
                : t("admin.bots.catalogNotDownloaded")}
          </AdminBadge>
          {catalogStatus.fetchedAt && (
            <span className="text-xs text-[#9e98b6]">
              {t("admin.bots.updated")}{" "}
              <span className="font-medium text-white">
                {new Date(catalogStatus.fetchedAt).toLocaleString()}
              </span>
            </span>
          )}
        </AdminSection>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <AdminSection className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-9 w-9 text-rose-400" />
          <p className="text-sm font-semibold text-white">{t("admin.bots.loadError")}</p>
          <p className="text-xs text-[#9e98b6]">{error}</p>
          <AdminButton onClick={fetchBots} variant="secondary">
            {t("common.retry")}
          </AdminButton>
        </AdminSection>
      ) : bots.length === 0 ? (
        <AdminEmptyState
          icon={BotIcon}
          title={t("admin.bots.emptyTitle")}
          description={t("admin.bots.emptyDescription")}
          action={
            <AdminButton onClick={openCreate} icon={Plus} variant="primary">
              {t("admin.bots.registerFirst")}
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {showModal && (
        <BotModal bot={editingBot} onClose={closeModal} onSaved={onSaved} />
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
