"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Save, Play, CheckCircle2, XCircle, X } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";

import { getErrorMessage } from "./helpers";

interface CatalogFilters {
  catalogFilterKnivesEnabled: boolean;
  catalogFilterGlovesEnabled: boolean;
  catalogFilterRiflesEnabled: boolean;
  catalogFilterPistolsEnabled: boolean;
  catalogFilterSMGsEnabled: boolean;
  catalogFilterHeavyEnabled: boolean;
  catalogFilterSouvenirEnabled: boolean;
  catalogFilterStatTrakEnabled: boolean;
  catalogMinPrice: number;
}

function ToggleSwitch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer select-none group">
      <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-accent" : "bg-white/10"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </label>
  );
}

const DEFAULT_FILTERS: CatalogFilters = {
  catalogFilterKnivesEnabled: true,
  catalogFilterGlovesEnabled: true,
  catalogFilterRiflesEnabled: true,
  catalogFilterPistolsEnabled: true,
  catalogFilterSMGsEnabled: true,
  catalogFilterHeavyEnabled: true,
  catalogFilterSouvenirEnabled: false,
  catalogFilterStatTrakEnabled: true,
  catalogMinPrice: 0.1,
};

export function SyncTab() {
  const { t } = useI18n();

  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Result, setStep1Result] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const [step3Loading, setStep3Loading] = useState(false);
  const [step3Result, setStep3Result] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [syncPricesResult, setSyncPricesResult] = useState<string | null>(null);
  const [syncPricesError, setSyncPricesError] = useState<string | null>(null);

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersSaving, setFiltersSaving] = useState(false);
  const [filtersSaved, setFiltersSaved] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(5);
  const [autoSyncSaving, setAutoSyncSaving] = useState(false);
  const [autoSyncSaved, setAutoSyncSaved] = useState(false);
  const [autoSyncRunning, setAutoSyncRunning] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<{
    currentStep: string;
    lastRunAt: string | null;
    nextRunAt: string | null;
    lastError: string | null;
    lastStep1ItemCount: number | null;
    lastStep2ItemCount: number | null;
  } | null>(null);

  const prevStepRef = useRef<string>("idle");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadFilters = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      if (!response.ok) return;
      const data = await response.json();
      setFilters({
        catalogFilterKnivesEnabled: data.catalogFilterKnivesEnabled ?? true,
        catalogFilterGlovesEnabled: data.catalogFilterGlovesEnabled ?? true,
        catalogFilterRiflesEnabled: data.catalogFilterRiflesEnabled ?? true,
        catalogFilterPistolsEnabled: data.catalogFilterPistolsEnabled ?? true,
        catalogFilterSMGsEnabled: data.catalogFilterSMGsEnabled ?? true,
        catalogFilterHeavyEnabled: data.catalogFilterHeavyEnabled ?? true,
        catalogFilterSouvenirEnabled: data.catalogFilterSouvenirEnabled ?? false,
        catalogFilterStatTrakEnabled: data.catalogFilterStatTrakEnabled ?? true,
        catalogMinPrice: data.catalogMinPrice ?? 0.1,
      });
      setAutoSyncEnabled(data.autoSyncEnabled ?? false);
      setAutoSyncInterval(data.autoSyncIntervalMinutes ?? 5);
    } catch {
      // keep defaults
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/auto-sync/status`, {
          credentials: "include",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (prevStepRef.current !== "idle" && data.currentStep === "idle") {
          if (data.lastError) {
            setToast({ type: "error", message: data.lastError });
          } else if (data.lastRunAt) {
            setToast({ type: "success", message: t("admin.settings.autoSyncComplete") || "Sincronización completada." });
          }
          setTimeout(() => setToast(null), 5000);
        }
        prevStepRef.current = data.currentStep;

        setAutoSyncStatus(data);
      } catch {
        // silent
      }
    };
    void pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveAutoSync = async () => {
    setAutoSyncSaving(true);
    setAutoSyncSaved(false);
    try {
      await fetch(`${BACKEND_URL}/admin/marketplace/settings/auto-sync`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({
          autoSyncEnabled,
          autoSyncIntervalMinutes: autoSyncInterval,
        }),
      });
      setAutoSyncSaved(true);
      setTimeout(() => setAutoSyncSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setAutoSyncSaving(false);
    }
  };

  const handleRunAutoSyncNow = async () => {
    setAutoSyncRunning(true);
    try {
      await fetch(`${BACKEND_URL}/admin/marketplace/settings/auto-sync/run-now`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
    } catch {
      // silent
    } finally {
      setAutoSyncRunning(false);
    }
  };

  const stepLabel = (step: string) => {
    switch (step) {
      case "step1_downloading": return t("admin.settings.step1Button");
      case "step2_generating": return t("admin.settings.step2Button");
      case "step3_syncing": return t("admin.settings.applyCatalogPrices");
      default: return t("admin.settings.autoSyncIdle");
    }
  };

  const handleSaveFilters = async () => {
    setFiltersSaving(true);
    setFiltersSaved(false);
    try {
      await fetch(`${BACKEND_URL}/admin/marketplace/settings/catalog-filters`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify(filters),
      });
      setFiltersSaved(true);
      setTimeout(() => setFiltersSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setFiltersSaving(false);
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

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-[3px] border text-xs font-bold shadow-lg animate-in slide-in-from-top ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-0.5 hover:bg-white/10 rounded cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px] space-y-6">
        <div className="max-w-xl w-full space-y-6">
          {/* Filtros del Catálogo Global */}
          <div className="space-y-4 p-5 bg-white/[0.02] border border-white/10 rounded-[3px]">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {t("admin.settings.catalogFiltersTitle")}
              </h3>
              <p className="text-[11px] text-[#84849b] mt-1 font-mono">
                {t("admin.settings.catalogFiltersDesc")}
              </p>
            </div>

            {filtersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b] mb-1">
                      {t("admin.settings.catalogFilterCategories")}
                    </p>
                    <ToggleSwitch label={t("admin.settings.catalogFilterKnives")} checked={filters.catalogFilterKnivesEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterKnivesEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterGloves")} checked={filters.catalogFilterGlovesEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterGlovesEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterRifles")} checked={filters.catalogFilterRiflesEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterRiflesEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterPistols")} checked={filters.catalogFilterPistolsEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterPistolsEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterSMGs")} checked={filters.catalogFilterSMGsEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterSMGsEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterHeavy")} checked={filters.catalogFilterHeavyEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterHeavyEnabled: v }))} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b] mb-1">
                      {t("admin.settings.catalogFilterOptions")}
                    </p>
                    <ToggleSwitch label={t("admin.settings.catalogFilterSouvenir")} checked={filters.catalogFilterSouvenirEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterSouvenirEnabled: v }))} />
                    <ToggleSwitch label={t("admin.settings.catalogFilterStatTrak")} checked={filters.catalogFilterStatTrakEnabled} onChange={(v) => setFilters((p) => ({ ...p, catalogFilterStatTrakEnabled: v }))} />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b] mb-2">
                      {t("admin.settings.catalogFilterMinPrice")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs font-mono">$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={filters.catalogMinPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFilters((prev) => ({ ...prev, catalogMinPrice: val }));
                        }}
                        className="w-24 px-3 py-1.5 bg-[#110f1e] border border-white/10 rounded-[3px] text-xs font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                      />
                      <span className="text-[10px] text-[#84849b] font-mono">USD</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveFilters}
                    disabled={filtersSaving}
                    className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase text-white rounded-[3px] transition flex items-center justify-center gap-2 cursor-pointer select-none"
                  >
                    {filtersSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {t("admin.settings.saveCatalogFilters")}
                  </button>

                  {filtersSaved && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">
                      {t("admin.settings.catalogFiltersSaved")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sincronización Modular Paso a Paso */}
          <div className="space-y-4 p-5 bg-white/[0.02] border border-white/10 rounded-[3px]">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {t("admin.settings.stepByStepTitle")}
              </h3>
              <p className="text-[11px] text-[#84849b] mt-1 font-mono">
                {t("admin.settings.youpinSyncIntro")}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Paso 1 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">{t("admin.settings.step", { number: 1 })}</span>
                  <span className="text-[10px] font-mono text-white/50">items-catalog.json</span>
                </div>
                <p className="text-xs text-[#84849b]">{t("admin.settings.downloadBaseCatalog")}</p>
                {step1Error && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{step1Error}</div>}
                {step1Result && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{step1Result}</div>}
                <button
                  type="button"
                  onClick={handleStep1DownloadCatalog}
                  disabled={step1Loading}
                  className="w-full py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {step1Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {t("admin.settings.step1Button")}
                </button>
              </div>

              {/* Paso 2 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">{t("admin.settings.step", { number: 2 })}</span>
                  <span className="text-[10px] font-mono text-white/50">catalog-global.json</span>
                </div>
                <p className="text-xs text-[#84849b]">{t("admin.settings.filterBaseCatalog")}</p>
                {step3Error && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{step3Error}</div>}
                {step3Result && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{step3Result}</div>}
                <button
                  type="button"
                  onClick={handleStep3GenerateCatalogGlobal}
                  disabled={step3Loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {step3Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {t("admin.settings.step2Button")}
                </button>
              </div>

              {/* Paso 3 */}
              <div className="p-4 bg-[#110f1e]/60 border border-white/5 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-accent tracking-wider">{t("admin.settings.step", { number: 3 })}</span>
                  <span className="text-[10px] font-mono text-white/50">store/bots</span>
                </div>
                <p className="text-xs text-[#84849b]">{t("admin.settings.applyCatalogPrices")}</p>
                {syncPricesError && <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">{syncPricesError}</div>}
                {syncPricesResult && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{syncPricesResult}</div>}
                <button
                  type="button"
                  onClick={handleSyncPrices}
                  disabled={syncingPrices}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-black uppercase text-white rounded transition flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {syncingPrices ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {syncingPrices
                    ? t("admin.settings.applyingBotPrices")
                    : t("admin.settings.applyCatalogPrices")}
                </button>
              </div>
            </div>
          </div>

          {/* Auto Sync */}
          <div className="space-y-4 p-5 bg-white/[0.02] border border-white/10 rounded-[3px]">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {t("admin.settings.autoSyncTitle")}
              </h3>
              <p className="text-[11px] text-[#84849b] mt-1 font-mono">
                {t("admin.settings.autoSyncDesc")}
              </p>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                label={t("admin.settings.autoSyncEnable")}
                checked={autoSyncEnabled}
                onChange={setAutoSyncEnabled}
              />

              {autoSyncEnabled && (
                <div className="pl-2 border-l-2 border-accent/30 space-y-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#84849b] mb-2">
                      {t("admin.settings.autoSyncInterval")}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        step={1}
                        value={autoSyncInterval}
                        onChange={(e) => setAutoSyncInterval(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1.5 bg-[#110f1e] border border-white/10 rounded-[3px] text-xs font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                      />
                      <span className="text-[10px] text-[#84849b] font-mono">min</span>
                    </div>
                  </div>

                  {autoSyncStatus && (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#110f1e]/60 border border-white/5 rounded-[3px] p-2.5">
                          <span className="text-[9px] text-[#84849b] uppercase font-bold block">{t("admin.settings.autoSyncStep")}</span>
                          <span className="text-white font-mono text-[11px] font-bold">{stepLabel(autoSyncStatus.currentStep)}</span>
                        </div>
                        <div className="bg-[#110f1e]/60 border border-white/5 rounded-[3px] p-2.5">
                          <span className="text-[9px] text-[#84849b] uppercase font-bold block">{t("admin.settings.autoSyncLastRun")}</span>
                          <span className="text-white font-mono text-[11px] font-bold">
                            {autoSyncStatus.lastRunAt ? new Date(autoSyncStatus.lastRunAt).toLocaleTimeString() : t("admin.settings.autoSyncNever")}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#110f1e]/60 border border-white/5 rounded-[3px] p-2.5">
                          <span className="text-[9px] text-[#84849b] uppercase font-bold block">{t("admin.settings.autoSyncNextRun")}</span>
                          <span className="text-white font-mono text-[11px] font-bold">
                            {autoSyncStatus.nextRunAt ? new Date(autoSyncStatus.nextRunAt).toLocaleTimeString() : "—"}
                          </span>
                        </div>
                        <div className="bg-[#110f1e]/60 border border-white/5 rounded-[3px] p-2.5">
                          <span className="text-[9px] text-[#84849b] uppercase font-bold block">{t("admin.settings.autoSyncStatus")}</span>
                          <span className={`font-mono text-[11px] font-bold ${autoSyncStatus.currentStep !== "idle" ? "text-emerald-400" : "text-[#84849b]"}`}>
                            {autoSyncStatus.currentStep !== "idle" ? t("admin.settings.autoSyncRunning") : t("admin.settings.autoSyncIdle")}
                          </span>
                        </div>
                      </div>
                      {autoSyncStatus.lastError && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">
                          {autoSyncStatus.lastError}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAutoSync}
                    disabled={autoSyncSaving}
                    className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-black uppercase text-white rounded-[3px] transition flex items-center justify-center gap-2 cursor-pointer select-none"
                  >
                    {autoSyncSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {t("admin.settings.saveAutoSync")}
                  </button>

                  {autoSyncSaved && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded">
                      {t("admin.settings.autoSyncSaved")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Run Now */}
          <div className="space-y-4 p-5 bg-white/[0.02] border border-white/10 rounded-[3px]">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">
                {t("admin.settings.autoSyncRunNow")}
              </p>
              <p className="text-[11px] text-[#84849b] mt-1 font-mono">
                {t("admin.settings.autoSyncRunNowDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunAutoSyncNow}
              disabled={autoSyncRunning || autoSyncStatus?.currentStep !== "idle"}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-black uppercase text-white rounded-[3px] transition flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {autoSyncRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {autoSyncRunning ? t("admin.settings.autoSyncRunning") : t("admin.settings.autoSyncRunNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
