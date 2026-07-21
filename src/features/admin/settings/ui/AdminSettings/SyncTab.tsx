"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import type { MarketSyncPhase, MarketSyncStatus, PriceCatalogStatus } from "@/features/admin/types";
import { RUNTIME_CONFIG_LABELS } from "./constants";
import { SectionHeader, FieldLabel, StyledInput } from "./FormControls";
import { getErrorMessage } from "./helpers";
import {
  createAcceptedPriceCatalogStatus,
  createAcceptedMarketSyncStatus,
  normalizeMarketSyncStatus,
  normalizePriceCatalogStatus,
  priceCatalogStatusFromTriggerResponse,
  statusFromTriggerResponse,
} from "./marketSync";

const PHASE_LABELS: Record<MarketSyncPhase, string> = {
  idle: "En espera",
  refreshing_items_catalog: "Actualizando catálogo de precios",
  building_priority_queue: "Ordenando skins por precio",
  collecting_assets: "Recolectando assets",
  waiting_rate_limit: "Esperando reinicio de cuota",
  validating_snapshot: "Validando snapshot",
  saving_snapshot: "Guardando snapshot",
  publishing_database: "Publicando en la base de datos",
  syncing_bots: "Actualizando bots",
  paused: "Pausada; se reanudará desde el checkpoint",
  completed: "Completada",
  failed: "Fallida",
  fetching_youpin: "Recolectando assets",
  downloading_assets: "Recolectando assets",
  saving_database: "Publicando en la base de datos",
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("es-AR");
}

function responseRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function responseMessage(value: unknown, fallback: string) {
  const record = responseRecord(value);
  return typeof record.message === "string"
    ? record.message
    : typeof record.error === "string"
      ? record.error
      : fallback;
}

type RecursiveStatusPollingOptions = {
  enabled: boolean;
  intervalMs: number;
  nextIntervalMs?: () => number;
  poll: (signal: AbortSignal) => Promise<void>;
  onError: (error: unknown) => void;
  timeoutMessage: string;
};

function useRecursiveStatusPolling({
  enabled,
  intervalMs,
  nextIntervalMs,
  poll,
  onError,
  timeoutMessage,
}: RecursiveStatusPollingOptions) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let requestController: AbortController | null = null;
    let pollTimer: number | null = null;
    let requestTimer: number | null = null;
    let consecutiveFailures = 0;

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      pollTimer = window.setTimeout(run, delayMs);
    };

    const run = async () => {
      if (cancelled) return;

      requestController = new AbortController();
      let timedOut = false;
      requestTimer = window.setTimeout(() => {
        timedOut = true;
        requestController?.abort();
      }, 10_000);

      try {
        await poll(requestController.signal);
        consecutiveFailures = 0;
        schedule(nextIntervalMs?.() ?? intervalMs);
      } catch (error: unknown) {
        if (cancelled) return;
        consecutiveFailures += 1;
        onError(timedOut ? new Error(timeoutMessage) : error);
        const baseRetryDelay = nextIntervalMs?.() ?? intervalMs;
        const retryDelay = Math.min(
          30_000,
          baseRetryDelay * 2 ** Math.max(0, consecutiveFailures - 1),
        );
        schedule(retryDelay);
      } finally {
        if (requestTimer !== null) window.clearTimeout(requestTimer);
        requestTimer = null;
        requestController = null;
      }
    };

    schedule(0);

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearTimeout(pollTimer);
      if (requestTimer !== null) window.clearTimeout(requestTimer);
      requestController?.abort();
    };
  }, [enabled, intervalMs, nextIntervalMs, onError, poll, timeoutMessage]);
}

function marketStatusPollingDelay(
  phase: MarketSyncPhase | undefined,
  quotaResetsAt: string | null | undefined,
) {
  if (phase !== "waiting_rate_limit" && phase !== "paused") return 2_000;

  const resetTimestamp = quotaResetsAt ? Date.parse(quotaResetsAt) : Number.NaN;
  if (!Number.isFinite(resetTimestamp)) return 10_000;

  const remaining = resetTimestamp - Date.now();
  return remaining > 0
    ? Math.min(30_000, Math.max(5_000, remaining + 250))
    : 5_000;
}

function StatusUnavailableWarning({
  message,
  hasLastKnownStatus,
  unavailableLabel,
  lastKnownLabel,
  awaitingLabel,
}: {
  message: string | null;
  hasLastKnownStatus: boolean;
  unavailableLabel: string;
  lastKnownLabel: string;
  awaitingLabel: string;
}) {
  if (!message) return null;

  return (
    <div className="space-y-1 rounded-[3px] border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-300">
      <p>{unavailableLabel}</p>
      <p className="font-medium text-amber-100/80">
        {hasLastKnownStatus ? lastKnownLabel : awaitingLabel}
      </p>
      <p className="break-words font-mono text-[10px] text-amber-100/60">{message}</p>
    </div>
  );
}

function SyncStatusCard({
  status,
  statusConfirmed,
}: {
  status: MarketSyncStatus;
  statusConfirmed: boolean;
}) {
  const target = status.targetAssets > 0 ? status.targetAssets : 10_000;
  const progress = Math.min(100, Math.max(0, Math.round((status.validAssets / target) * 100)));
  const waiting = status.phase === "waiting_rate_limit";
  const paused = status.phase === "paused";
  const exhausted = status.completionReason === "catalog_exhausted";
  const failed = status.phase === "failed";
  const completed = status.phase === "completed";
  const active = status.running && !waiting;
  const resetAt = formatDate(status.quotaResetsAt);
  const finishedAt = formatDate(status.lastFinishedAt);
  const tone = failed
    ? "bg-red-500/10 border-red-500/20 text-red-400"
    : waiting || paused || exhausted
      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
      : completed
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-sky-500/10 border-sky-500/20 text-sky-400";

  return (
    <div className={`p-4 rounded-[3px] border ${tone} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {(active || waiting) && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider">
              {!statusConfirmed
                ? "Inicio aceptado; esperando confirmación"
                : waiting
                ? "Sincronización esperando cuota"
                : paused
                  ? "Sincronización pausada"
                  : completed
                    ? exhausted
                      ? "Sincronización completada parcialmente"
                      : "Sincronización completada"
                    : failed
                      ? "Sincronización fallida"
                      : "Sincronización en curso"}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
              {PHASE_LABELS[status.phase]}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs font-black">{progress}%</span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-bold text-[#b4b4c5]">
          <span>Assets válidos</span>
          <span className="font-mono">
            {status.validAssets.toLocaleString("es-AR")} / {target.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full transition-all duration-300 ${failed ? "bg-red-400" : waiting || paused || exhausted ? "bg-amber-400" : "bg-accent"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-[3px] border border-white/5 bg-black/10 p-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">Descargados</p>
          <p className="mt-1 font-mono text-xs font-black text-white">{status.rawAssets.toLocaleString("es-AR")}</p>
        </div>
        <div className="rounded-[3px] border border-white/5 bg-black/10 p-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">Descartados</p>
          <p className="mt-1 font-mono text-xs font-black text-white">{status.skippedAssets.toLocaleString("es-AR")}</p>
        </div>
        <div className="rounded-[3px] border border-white/5 bg-black/10 p-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">Candidatos</p>
          <p className="mt-1 font-mono text-xs font-black text-white">
            {status.candidatesVisited.toLocaleString("es-AR")}
            {status.totalCandidates > 0 ? ` / ${status.totalCandidates.toLocaleString("es-AR")}` : ""}
          </p>
        </div>
        <div className="rounded-[3px] border border-white/5 bg-black/10 p-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">Cuota actual</p>
          <p className="mt-1 font-mono text-xs font-black text-white">
            {status.quotaUnitsUsed.toLocaleString("es-AR")} / {status.quotaLimit.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {status.message && (
        <p className="text-xs font-medium leading-relaxed text-[#b4b4c5]">{status.message}</p>
      )}

      {status.currentCandidate && (
        <p className="break-words font-mono text-[10px] text-[#84849b]">
          Skin actual: <span className="text-white">{status.currentCandidate}</span>
        </p>
      )}

      {status.creditsUsed != null && status.creditsUsed > 0 && (
        <p className="font-mono text-[10px] text-[#84849b]">
          Créditos informados por SteamWebAPI: {status.creditsUsed.toLocaleString("es-AR")}.
        </p>
      )}

      {waiting && resetAt && (
        <p className="text-xs font-bold text-amber-200">Reanudación estimada: {resetAt}.</p>
      )}

      {paused && (
        <p className="text-xs font-bold text-amber-200">
          El avance quedó guardado. La próxima ejecución continuará desde el checkpoint.
        </p>
      )}

      {completed && (
        <div className="space-y-1 text-[10px] font-bold text-[#b4b4c5]">
          <p>
            Resultado: {exhausted ? "se agotó el catálogo elegible" : "se alcanzó el objetivo de assets"}.
          </p>
          {(status.publishedListings > 0 || status.publishedFloats > 0) && (
            <p>
              Publicados: {status.publishedListings.toLocaleString("es-AR")} listings y{" "}
              {status.publishedFloats.toLocaleString("es-AR")} assets.
            </p>
          )}
          {finishedAt && <p>Finalizada: {finishedAt}.</p>}
        </div>
      )}

      {failed && status.lastError && (
        <p className="break-words text-xs font-bold text-red-300">{status.lastError}</p>
      )}

      {status.snapshotHash && (
        <p className="break-all font-mono text-[9px] text-[#67677d]">
          Snapshot: {status.snapshotHash}
        </p>
      )}

      {(status.running || status.resumable) && status.lastPublished && (
        <p className="text-[10px] font-bold text-[#84849b]">
          Snapshot anterior visible: {status.lastPublished.validAssets.toLocaleString("es-AR")} assets,
          {" "}{status.lastPublished.publishedListings.toLocaleString("es-AR")} listings.
        </p>
      )}
    </div>
  );
}

function PriceCatalogStatusCard({
  status,
  statusConfirmed,
}: {
  status: PriceCatalogStatus;
  statusConfirmed: boolean;
}) {
  const { t } = useI18n();
  const running = Boolean(status.running);
  const currentPage = status.currentPage ?? 0;
  const totalPages = status.totalPages ?? status.pageCount;
  const currentItems = running
    ? status.currentItemCount ?? status.itemCount
    : status.itemCount;
  const progress = totalPages > 0
    ? Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)))
    : null;
  const tone = status.lastError
    ? "border-red-500/20 bg-red-500/10 text-red-400"
    : running || !statusConfirmed
      ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
      : status.exists && !status.stale
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        : "border-amber-500/20 bg-amber-500/10 text-amber-300";

  return (
    <div className={`space-y-4 rounded-[3px] border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {(running || !statusConfirmed) && (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-wider">
              {!statusConfirmed
                ? t("admin.settings.catalogAwaitingConfirmation")
                : running
                  ? t("admin.settings.catalogDownloading")
                  : status.exists
                    ? status.stale
                      ? t("admin.settings.catalogStale")
                      : t("admin.settings.catalogReady")
                    : t("admin.settings.catalogMissing")}
            </p>
            {running && totalPages > 0 && (
              <p className="mt-1 font-mono text-[10px] text-[#b4b4c5]">
                {t("admin.settings.catalogPageProgress", {
                  current: currentPage,
                  total: totalPages,
                })}
              </p>
            )}
          </div>
        </div>
        {progress !== null && running && (
          <span className="shrink-0 font-mono text-xs font-black">{progress}%</span>
        )}
      </div>

      {progress !== null && running && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[3px] border border-white/10 bg-black/10 p-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">
            {running ? t("admin.settings.catalogItemsDownloaded") : t("admin.settings.catalogItems")}
          </p>
          <p className="mt-1 text-lg font-black text-white">{currentItems.toLocaleString()}</p>
        </div>
        <div className="rounded-[3px] border border-white/10 bg-black/10 p-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">
            {t("admin.settings.lastUpdate")}
          </p>
          <p className="mt-1 text-xs font-bold text-white">
            {formatDate(status.fetchedAt) ?? t("admin.settings.noCatalog")}
          </p>
        </div>
        <div className="rounded-[3px] border border-white/10 bg-black/10 p-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b]">
            {t("admin.settings.catalogSource")}
          </p>
          <p className="mt-1 break-words font-mono text-xs font-black text-white">
            {status.market || "steam"} · {status.currency || "USD"}
          </p>
        </div>
      </div>

      {status.lastError && !running && (
        <p className="break-words text-xs font-bold text-red-300">{status.lastError}</p>
      )}
    </div>
  );
}

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
  const [catalogResult, setCatalogResult] = useState<string | null>(null);
  const [catalogStatusError, setCatalogStatusError] = useState<string | null>(null);
  const [catalogStatusConfirmed, setCatalogStatusConfirmed] = useState(false);

  const [syncStatus, setSyncStatus] = useState<MarketSyncStatus | null>(null);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);
  const [syncStatusConfirmed, setSyncStatusConfirmed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = window.localStorage.getItem("last_sync_timestamp");
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

  const fetchRuntimeConfig = useCallback(async () => {
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
  }, [t]);

  const fetchCatalogStatus = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`${BACKEND_URL}/store/prices/catalog/status`, {
      credentials: "include",
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      signal,
    });
    const data: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(responseMessage(data, t("admin.bots.catalogStatusError")));
    }
    setCatalogStatus((current) => normalizePriceCatalogStatus(data, current));
    setCatalogStatusConfirmed(true);
    setCatalogStatusError(null);
  }, [t]);

  const fetchSyncStatus = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`${BACKEND_URL}/market/sync/status`, {
      credentials: "include",
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      signal,
    });
    const data: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(responseMessage(data, t("admin.settings.marketStatusRequestError")));
    }
    setSyncStatus((current) => normalizeMarketSyncStatus(data, current));
    setSyncStatusConfirmed(true);
    setSyncStatusError(null);
  }, [t]);

  const handleCatalogStatusError = useCallback((error: unknown) => {
    setCatalogStatusError(getErrorMessage(error, t("admin.bots.catalogStatusError")));
  }, [t]);

  const handleSyncStatusError = useCallback((error: unknown) => {
    setSyncStatusError(getErrorMessage(error, t("admin.settings.marketStatusRequestError")));
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchRuntimeConfig();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchRuntimeConfig]);

  const catalogPollingEnabled =
    catalogStatus === null || Boolean(catalogStatus.running) || refreshingCatalog;
  useRecursiveStatusPolling({
    enabled: catalogPollingEnabled,
    intervalMs: 5_000,
    poll: fetchCatalogStatus,
    onError: handleCatalogStatusError,
    timeoutMessage: t("admin.settings.statusRequestTimeout"),
  });

  const waitingForQuota = syncStatus?.phase === "waiting_rate_limit";
  const recoverablePause = syncStatus?.phase === "paused" && Boolean(syncStatus.resumable);
  const marketPollingEnabled =
    syncStatus === null ||
    (syncStatus.phase !== "failed" &&
      (Boolean(syncStatus.running) || waitingForQuota || recoverablePause));
  const getMarketPollingInterval = useCallback(
    () => marketStatusPollingDelay(syncStatus?.phase, syncStatus?.quotaResetsAt),
    [syncStatus?.phase, syncStatus?.quotaResetsAt],
  );
  useRecursiveStatusPolling({
    enabled: marketPollingEnabled,
    intervalMs: waitingForQuota || recoverablePause ? 10_000 : 2_000,
    nextIntervalMs: getMarketPollingInterval,
    poll: fetchSyncStatus,
    onError: handleSyncStatusError,
    timeoutMessage: t("admin.settings.statusRequestTimeout"),
  });

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
    if (cooldownLeft > 0 && !syncStatus?.resumable) return;
    setSyncingAll(true);
    setSyncResult(null);
    setSyncError(null);
    setSyncStatusError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/market/sync`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (response.status === 409) {
        const record = responseRecord(data);
        const blockingJob = record.blockingJob;
        const message = responseMessage(data, t("admin.settings.marketSyncAlreadyRunning"));
        if (blockingJob === "market_assets") {
          const currentStatus = statusFromTriggerResponse(data);
          setSyncStatus(currentStatus ?? createAcceptedMarketSyncStatus(message));
          setSyncStatusConfirmed(Boolean(currentStatus));
        }
        setSyncResult(message);
        return;
      }
      if (!response.ok) {
        throw new Error(responseMessage(data, t("admin.settings.syncServerError")));
      }
      const message = responseMessage(data, t("admin.settings.fullSyncSuccess"));
      const triggerStatus = statusFromTriggerResponse(data);
      setSyncResult(message);
      setSyncStatus(triggerStatus ?? createAcceptedMarketSyncStatus(message));
      setSyncStatusConfirmed(Boolean(triggerStatus));
      
      const now = Date.now();
      window.localStorage.setItem("last_sync_timestamp", String(now));
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
    setCatalogStatusError(null);
    setCatalogResult(null);
    try {
      const response = await fetch(`${BACKEND_URL}/store/prices/catalog/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data: unknown = await response.json().catch(() => ({}));
      const returnedCatalog = priceCatalogStatusFromTriggerResponse(data, catalogStatus);
      if (response.status === 409) {
        const message = responseMessage(data, t("admin.bots.catalogInProgress"));
        setCatalogStatus(returnedCatalog ?? createAcceptedPriceCatalogStatus(catalogStatus));
        setCatalogStatusConfirmed(Boolean(returnedCatalog));
        setCatalogResult(message);
        return;
      }
      if (!response.ok) {
        throw new Error(responseMessage(data, t("admin.bots.catalogDownloadError")));
      }
      const message = responseMessage(data, t("admin.bots.catalogDownloadStarted"));
      setCatalogResult(message);
      setCatalogStatus(returnedCatalog ?? createAcceptedPriceCatalogStatus(catalogStatus));
      setCatalogStatusConfirmed(Boolean(returnedCatalog));
      const record = responseRecord(data);
      if (Array.isArray(record.errors) && record.errors.length > 0) {
        setCatalogError(record.errors.filter((error): error is string => typeof error === "string").join(" | "));
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
              <li>{t("admin.settings.syncProcessPriority")}</li>
              <li>
                {t("admin.settings.syncProcessCatalogPrefix")}{" "}
                <span className="text-white break-all">/steam/api/float/assets</span>{" "}
                {t("admin.settings.syncProcessCatalogSuffix")}
              </li>
              <li>{t("admin.settings.syncProcessTarget")}</li>
              <li>{t("admin.settings.syncProcessPersistence")}</li>
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

          <StatusUnavailableWarning
            message={syncStatusError}
            hasLastKnownStatus={syncStatusConfirmed && syncStatus !== null}
            unavailableLabel={t("admin.settings.marketStatusUnavailable")}
            lastKnownLabel={t("admin.settings.statusShowingLastKnown")}
            awaitingLabel={t("admin.settings.statusAwaitingConfirmation")}
          />

          {syncStatus && (syncStatus.running || syncStatus.phase !== "idle") && (
            <SyncStatusCard status={syncStatus} statusConfirmed={syncStatusConfirmed} />
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleFullSync}
              disabled={
                syncingAll ||
                Boolean(syncStatus?.running) ||
                (cooldownLeft > 0 && !syncStatus?.resumable)
              }
              className="w-full sm:w-auto px-6 py-3.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.25)] cursor-pointer select-none"
            >
              {syncingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <RefreshCw className={`w-4 h-4 text-white ${syncingAll ? "animate-spin" : ""}`} />
              )}
              {syncingAll
                ? t("admin.settings.syncingAll")
                : syncStatus?.resumable
                ? "Reanudar sincronización desde checkpoint"
                : cooldownLeft > 0
                ? t("admin.settings.cooldown", { minutes: Math.floor(cooldownLeft / 60), seconds: cooldownLeft % 60 })
                : t("admin.settings.syncAll")}
            </button>

            {cooldownLeft > 0 && !syncStatus?.resumable && (
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

            <StatusUnavailableWarning
              message={catalogStatusError}
              hasLastKnownStatus={catalogStatusConfirmed && catalogStatus !== null}
              unavailableLabel={t("admin.settings.catalogStatusUnavailable")}
              lastKnownLabel={t("admin.settings.statusShowingLastKnown")}
              awaitingLabel={t("admin.settings.statusAwaitingConfirmation")}
            />

            {catalogStatus && (
              <PriceCatalogStatusCard
                status={catalogStatus}
                statusConfirmed={catalogStatusConfirmed}
              />
            )}

            {catalogError && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold rounded-[3px]">
                {catalogError}
              </div>
            )}

            {catalogResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-[3px]">
                {catalogResult}
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
                  ? t("admin.settings.catalogDownloading")
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
