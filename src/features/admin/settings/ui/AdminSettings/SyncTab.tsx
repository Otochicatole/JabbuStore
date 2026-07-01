"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import type { PriceCatalogStatus } from "@/features/admin/types";
import { RUNTIME_CONFIG_LABELS } from "./constants";
import { SectionHeader, FieldLabel, StyledInput } from "./FormControls";
import { getErrorMessage } from "./helpers";

export function SyncTab() {
  const { t } = useI18n();
  const [runtimeConfig, setRuntimeConfig] = useState<Record<string, string>>({});
  const [savingRuntimeConfig, setSavingRuntimeConfig] = useState(false);
  const [runtimeConfigMessage, setRuntimeConfigMessage] = useState<string | null>(null);

  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [syncingPrices, setSyncingPrices] = useState(false);
  const [syncPricesResult, setSyncPricesResult] = useState<string | null>(null);
  const [syncPricesError, setSyncPricesError] = useState<string | null>(null);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState<PriceCatalogStatus | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = localStorage.getItem("last_sync_timestamp");
      if (saved) {
        const diff = Date.now() - Number(saved);
        const remaining = Math.max(0, Math.ceil((3 * 60 * 1000 - diff) / 1000));
        setCooldownLeft(remaining);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  const fetchRuntimeConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/runtime-config`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.loadRuntimeError"));
      }
      setRuntimeConfig(data);
    } catch (err: unknown) {
      setRuntimeConfigMessage(getErrorMessage(err, t("admin.settings.loadRuntimeError")));
    }
  };

  const fetchCatalogStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/store/prices/catalog/status`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.bots.catalogStatusError"));
      }
      setCatalogStatus(data);
      setCatalogError(null);
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, t("admin.bots.catalogStatusError")));
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCatalogStatus();
      void fetchRuntimeConfig();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!catalogStatus?.running) return;
    const interval = window.setInterval(() => {
      void fetchCatalogStatus();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [catalogStatus?.running]);

  const handleRuntimeConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRuntimeConfig(true);
    setRuntimeConfigMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/runtime-config`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify(runtimeConfig),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.saveRuntimeError"));
      }
      setRuntimeConfig(data);
      setRuntimeConfigMessage(t("admin.settings.requiresRestart"));
    } catch (err: unknown) {
      setRuntimeConfigMessage(getErrorMessage(err, t("admin.settings.saveRuntimeError")));
    } finally {
      setSavingRuntimeConfig(false);
    }
  };

  const handleFullSync = async () => {
    if (cooldownLeft > 0) return;
    setSyncingAll(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/market/sync`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.syncServerError"));
      }
      setSyncResult(data.message || t("admin.settings.fullSyncSuccess"));
      
      const now = Date.now();
      localStorage.setItem("last_sync_timestamp", String(now));
      setCooldownLeft(180); // 3 minutos
    } catch (err: unknown) {
      setSyncError(getErrorMessage(err, t("admin.settings.syncAppError")));
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRefreshPriceCatalog = async () => {
    setRefreshingCatalog(true);
    setCatalogError(null);
    setSyncPricesResult(null);
    try {
      const response = await fetch(`${BACKEND_URL}/store/prices/catalog/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setCatalogStatus(data.catalog ?? null);
        setCatalogError(data.message || t("admin.bots.catalogInProgress"));
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || t("admin.bots.catalogDownloadError"));
      }
      setCatalogStatus(data.catalog ?? null);
      setSyncPricesResult(data.message || t("admin.bots.catalogDownloadStarted"));
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setCatalogError(data.errors.join(" | "));
      }
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, t("admin.bots.catalogDownloadError")));
    } finally {
      setRefreshingCatalog(false);
    }
  };

  const handleSyncPrices = async () => {
    setSyncingPrices(true);
    setSyncPricesResult(null);
    setSyncPricesError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/store/sync-prices`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.syncBotPricesError"));
      }
      setSyncPricesResult(
        data.message ||
          t("admin.settings.syncBotPricesStarted"),
      );
      void fetchCatalogStatus();
    } catch (err: unknown) {
      setSyncPricesError(getErrorMessage(err, t("admin.settings.syncPricesError")));
    } finally {
      setSyncingPrices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px] space-y-6">
        <SectionHeader
          title={t("admin.settings.fullSyncTitle")}
          desc={t("admin.settings.fullSyncDesc")}
        />

        <form onSubmit={handleRuntimeConfigSubmit} className="max-w-3xl space-y-4 p-4 bg-white/[0.01] border border-white/5 rounded-[3px]">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              {t("admin.settings.syncConfigTitle")}
            </h3>
            <p className="text-[10px] text-[#84849b] mt-1 font-mono">
              {t("admin.settings.syncConfigDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RUNTIME_CONFIG_LABELS.map((item) => (
              <div key={item.key} className="space-y-1.5">
                <FieldLabel>{item.label}</FieldLabel>
                {item.type === "boolean" ? (
                  <AdminSelect
                    value={runtimeConfig[item.key] || ""}
                    onChange={(value) =>
                      setRuntimeConfig((prev) => ({ ...prev, [item.key]: value }))
                    }
                    options={[
                      { value: "", label: t("common.useEnv") },
                      { value: "true", label: t("common.enabled") },
                      { value: "false", label: t("common.disabled") },
                    ]}
                  />
                ) : (
                  <StyledInput
                    type={item.type === "number" ? "number" : "text"}
                    value={runtimeConfig[item.key] || ""}
                    onChange={(event) =>
                      setRuntimeConfig((prev) => ({ ...prev, [item.key]: event.target.value }))
                    }
                    placeholder={t("common.useEnv")}
                  />
                )}
              </div>
            ))}
          </div>

          {runtimeConfigMessage && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs font-bold rounded-[3px]">
              {runtimeConfigMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={savingRuntimeConfig}
            className="px-6 py-3 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-all disabled:opacity-60 cursor-pointer flex items-center gap-2"
          >
            {savingRuntimeConfig && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("admin.settings.saveSync")}
          </button>
        </form>
        
        <div className="max-w-xl w-full space-y-6">
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-[3px] space-y-3 min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              {t("admin.settings.executedProcesses")}
            </h3>
            <ul className="text-xs text-[#84849b] list-disc list-inside space-y-1.5 font-medium">
              <li>
                {t("admin.settings.syncProcessCatalogPrefix")}{" "}
                <span className="text-white break-all">/steam/api/float/assets</span>{" "}
                {t("admin.settings.syncProcessCatalogSuffix")}
              </li>
              <li>{t("admin.settings.syncProcessPersistence")}</li>
              <li>{t("admin.settings.syncProcessInventory")}</li>
            </ul>
          </div>

          {syncError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-[3px]">
              {syncError}
            </div>
          )}

          {syncResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-[3px]">
              {syncResult}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleFullSync}
              disabled={syncingAll || cooldownLeft > 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.25)] cursor-pointer select-none"
            >
              {syncingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <RefreshCw className={`w-4 h-4 text-white ${syncingAll ? "animate-spin" : ""}`} />
              )}
              {syncingAll
                ? t("admin.settings.syncingAll")
                : cooldownLeft > 0
                ? t("admin.settings.cooldown", { minutes: Math.floor(cooldownLeft / 60), seconds: cooldownLeft % 60 })
                : t("admin.settings.syncAll")}
            </button>

            {cooldownLeft > 0 && (
              <span className="text-[10px] text-[#84849b] font-mono font-bold uppercase tracking-wider self-center">
                * {t("admin.settings.cooldownHelp")}
              </span>
            )}
          </div>

          <hr className="border-white/5 my-6" />

          <div className="space-y-4">
            <SectionHeader
              title={t("admin.settings.localPriceCatalog")}
              desc={t("admin.settings.localPriceCatalogDesc")}
            />

            {catalogStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                  <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                    {t("admin.settings.catalogItems")}
                  </p>
                  <p className="text-lg font-black text-white">
                    {catalogStatus.itemCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                  <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                    {t("admin.settings.lastUpdate")}
                  </p>
                  <p className="text-xs font-bold text-white">
                    {catalogStatus.fetchedAt
                      ? new Date(catalogStatus.fetchedAt).toLocaleString()
                      : t("admin.settings.noCatalog")}
                  </p>
                </div>
                <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                  <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                    Estado
                  </p>
                  <p className={`text-xs font-black ${catalogStatus.running ? "text-sky-400" : catalogStatus.stale ? "text-amber-400" : "text-emerald-400"}`}>
                    {catalogStatus.running
                      ? t("admin.settings.catalogDownloading")
                      : catalogStatus.exists
                      ? catalogStatus.stale
                        ? t("admin.settings.catalogStale")
                        : t("admin.settings.catalogReady")
                      : t("admin.settings.catalogMissing")}
                  </p>
                </div>
              </div>
            )}

            {catalogError && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold rounded-[3px]">
                {catalogError}
              </div>
            )}

            {syncPricesError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-[3px]">
                {syncPricesError}
              </div>
            )}

            {syncPricesResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-[3px]">
                {syncPricesResult}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefreshPriceCatalog}
                disabled={refreshingCatalog || Boolean(catalogStatus?.running)}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)] cursor-pointer select-none"
              >
                {refreshingCatalog || catalogStatus?.running ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-white" />
                )}
                {refreshingCatalog || catalogStatus?.running
                  ? t("admin.settings.downloadingPrices")
                  : t("admin.settings.downloadPriceCatalog")}
              </button>

              <button
                type="button"
                onClick={handleSyncPrices}
                disabled={syncingPrices || !catalogStatus?.exists}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-xs font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                {syncingPrices ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-white" />
                )}
                {syncingPrices
                  ? t("admin.settings.applyingBotPrices")
                  : t("admin.settings.applyCatalogPrices")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
