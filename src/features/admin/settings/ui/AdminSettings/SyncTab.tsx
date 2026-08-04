"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import type { PriceCatalogStatus } from "@/features/admin/types";

import { SectionHeader } from "./FormControls";
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
  const { locale, t } = useI18n();






  // Pasos Individuales (Pruebas Manuales)
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Result, setStep1Result] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);



  const [step3Loading, setStep3Loading] = useState(false);
  const [step3Result, setStep3Result] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  const [step4Loading, setStep4Loading] = useState(false);
  const [step4Result, setStep4Result] = useState<string | null>(null);
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [syncPricesResult, setSyncPricesResult] = useState<string | null>(null);
  const [syncPricesError, setSyncPricesError] = useState<string | null>(null);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState<PriceCatalogStatus | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogResult, setCatalogResult] = useState<string | null>(null);
  const [catalogStatusError, setCatalogStatusError] = useState<string | null>(null);
  const [catalogStatusConfirmed, setCatalogStatusConfirmed] = useState(false);





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



  const handleCatalogStatusError = useCallback((error: unknown) => {
    setCatalogStatusError(getErrorMessage(error, t("admin.bots.catalogStatusError")));
  }, [t]);





  const catalogPollingEnabled =
    catalogStatus === null || Boolean(catalogStatus.running) || refreshingCatalog;
  useRecursiveStatusPolling({
    enabled: catalogPollingEnabled,
    intervalMs: 5_000,
    poll: fetchCatalogStatus,
    onError: handleCatalogStatusError,
    timeoutMessage: t("admin.settings.statusRequestTimeout"),
  });







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
      setSyncPricesError(getErrorMessage(err, t("admin.settings.syncBotPricesError")));
    } finally {
      setSyncingPrices(false);
    }
  };

  const handleStep1DownloadCatalog = async () => {
    setStep1Loading(true);
    setStep1Result(null);
    setStep1Error(null);
    try {
      const response = await fetch(`${BACKEND_URL}/market/download-items-catalog`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error descargando items-catalog.json");
      setStep1Result(`Éxito: ${data.message} (${data.itemCount?.toLocaleString() ?? 0} ítems)`);
    } catch (err) {
      setStep1Error(getErrorMessage(err, "Error al ejecutar Paso 1"));
    } finally {
      setStep1Loading(false);
    }
  };

  const handleStep3GenerateCatalogGlobal = async () => {
    setStep3Loading(true);
    setStep3Result(null);
    setStep3Error(null);
    try {
      const response = await fetch(`${BACKEND_URL}/market/generate-catalog-global`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error generando catalog-global.json");
      setStep3Result(`Éxito: ${data.message} (${data.matchedItemsCount?.toLocaleString() ?? 0} ítems cruzados)`);
    } catch (err) {
      setStep3Error(getErrorMessage(err, "Error al ejecutar Paso 3"));
    } finally {
      setStep3Loading(false);
    }
  };

  const handleStep4SyncCatalogDb = async () => {
    setStep4Loading(true);
    setStep4Result(null);
    setStep4Error(null);
    try {
      const response = await fetch(`${BACKEND_URL}/market/sync-catalog-global-db`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error sincronizando a BD");
      setStep4Result(`Éxito: ${data.message} (${data.totalListingsUpserted?.toLocaleString() ?? 0} listings actualizadas en BD)`);
    } catch (err) {
      setStep4Error(getErrorMessage(err, "Error al ejecutar Paso 4"));
    } finally {
      setStep4Loading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px] space-y-6">


        
        <div className="max-w-xl w-full space-y-6">
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

          <hr className="border-white/5 my-6" />

          {/* Sincronización Modular Paso a Paso */}
          <div className="space-y-4 p-5 bg-white/[0.02] border border-white/10 rounded-[3px]">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Procesos Manuales Paso a Paso (Testeo Individual)
              </h3>
              <p className="text-[11px] text-[#84849b] mt-1 font-mono">
                Ejecuta y verifica cada fase del flujo de sincronización del Mercado Global YouPin de forma independiente.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Paso 1 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">Paso 1</span>
                  <span className="text-[10px] font-mono text-white/50">items-catalog.json</span>
                </div>
                <p className="text-xs text-[#84849b]">Descarga el catálogo base completo desde /steam/api/items.</p>
                {step1Error && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{step1Error}</div>}
                {step1Result && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{step1Result}</div>}
                <button
                  type="button"
                  onClick={handleStep1DownloadCatalog}
                  disabled={step1Loading}
                  className="w-full py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {step1Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  1. Descargar items-catalog.json
                </button>
              </div>

              {/* Paso 2 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">Paso 2</span>
                  <span className="text-[10px] font-mono text-white/50">catalog-global.json</span>
                </div>
                <p className="text-xs text-[#84849b]">Filtra el catálogo base y genera catalog-global.json.</p>
                {step3Error && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{step3Error}</div>}
                {step3Result && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{step3Result}</div>}
                <button
                  type="button"
                  onClick={handleStep3GenerateCatalogGlobal}
                  disabled={step3Loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {step3Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  2. Generar catalog-global.json
                </button>
              </div>

              {/* Paso 3 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">Paso 3</span>
                  <span className="text-[10px] font-mono text-white/50">Base de Datos (MarketListing)</span>
                </div>
                <p className="text-xs text-[#84849b]">Sincroniza catalog-global.json a las tablas de la BD.</p>
                {step4Error && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{step4Error}</div>}
                {step4Result && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{step4Result}</div>}
                <button
                  type="button"
                  onClick={handleStep4SyncCatalogDb}
                  disabled={step4Loading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {step4Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  3. Pushear a Base de Datos
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
