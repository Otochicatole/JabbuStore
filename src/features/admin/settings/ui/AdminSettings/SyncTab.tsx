"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Save, Play, CheckCircle2, XCircle, X } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminAlert, AdminBadge, AdminButton, AdminSection } from "@/features/admin/ui/AdminShell";
import { FieldLabel, SectionHeader, StyledInput, ToggleSwitch } from "./FormControls";

import { getErrorMessage } from "./helpers";

interface CatalogFilters {
  catalogFilterKnivesEnabled: boolean;
  catalogFilterGlovesEnabled: boolean;
  catalogFilterRiflesEnabled: boolean;
  catalogFilterPistolsEnabled: boolean;
  catalogFilterSMGsEnabled: boolean;
  catalogFilterHeavyEnabled: boolean;
  catalogFilterEquipmentEnabled: boolean;
  catalogFilterStickersEnabled: boolean;
  catalogFilterContainersEnabled: boolean;
  catalogFilterAgentsEnabled: boolean;
  catalogFilterCharmsEnabled: boolean;
  catalogFilterGraffitiEnabled: boolean;
  catalogFilterPatchesEnabled: boolean;
  catalogFilterMusicKitsEnabled: boolean;
  catalogFilterCollectiblesEnabled: boolean;
  catalogFilterPassesEnabled: boolean;
  catalogFilterKeysEnabled: boolean;
  catalogFilterGiftsEnabled: boolean;
  catalogFilterToolsEnabled: boolean;
  catalogFilterTagsEnabled: boolean;
  catalogFilterSouvenirEnabled: boolean;
  catalogFilterStatTrakEnabled: boolean;
  catalogMinPrice: number;
}

function FilterToggle({
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
    <label className="group flex cursor-pointer items-center justify-between gap-3 py-1.5 select-none">
      <span className="text-xs sm:text-[13px] font-medium text-[#c2bdd6] transition-colors group-hover:text-white">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
          checked ? "bg-accent" : "bg-[#1c1833] border border-white/10"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
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
  catalogFilterEquipmentEnabled: false,
  catalogFilterStickersEnabled: false,
  catalogFilterContainersEnabled: false,
  catalogFilterAgentsEnabled: false,
  catalogFilterCharmsEnabled: false,
  catalogFilterGraffitiEnabled: false,
  catalogFilterPatchesEnabled: false,
  catalogFilterMusicKitsEnabled: false,
  catalogFilterCollectiblesEnabled: false,
  catalogFilterPassesEnabled: false,
  catalogFilterKeysEnabled: false,
  catalogFilterGiftsEnabled: false,
  catalogFilterToolsEnabled: false,
  catalogFilterTagsEnabled: false,
  catalogFilterSouvenirEnabled: false,
  catalogFilterStatTrakEnabled: true,
  catalogMinPrice: 0.1,
};

const CATEGORY_FILTERS = [
  ["catalogFilterKnivesEnabled", "admin.settings.catalogFilterKnives"],
  ["catalogFilterGlovesEnabled", "admin.settings.catalogFilterGloves"],
  ["catalogFilterRiflesEnabled", "admin.settings.catalogFilterRifles"],
  ["catalogFilterPistolsEnabled", "admin.settings.catalogFilterPistols"],
  ["catalogFilterSMGsEnabled", "admin.settings.catalogFilterSMGs"],
  ["catalogFilterHeavyEnabled", "admin.settings.catalogFilterHeavy"],
  ["catalogFilterEquipmentEnabled", "admin.settings.catalogFilterEquipment"],
  ["catalogFilterStickersEnabled", "admin.settings.catalogFilterStickers"],
  ["catalogFilterContainersEnabled", "admin.settings.catalogFilterContainers"],
  ["catalogFilterAgentsEnabled", "admin.settings.catalogFilterAgents"],
  ["catalogFilterCharmsEnabled", "admin.settings.catalogFilterCharms"],
  ["catalogFilterGraffitiEnabled", "admin.settings.catalogFilterGraffiti"],
  ["catalogFilterPatchesEnabled", "admin.settings.catalogFilterPatches"],
  ["catalogFilterMusicKitsEnabled", "admin.settings.catalogFilterMusicKits"],
  ["catalogFilterCollectiblesEnabled", "admin.settings.catalogFilterCollectibles"],
  ["catalogFilterPassesEnabled", "admin.settings.catalogFilterPasses"],
  ["catalogFilterKeysEnabled", "admin.settings.catalogFilterKeys"],
  ["catalogFilterGiftsEnabled", "admin.settings.catalogFilterGifts"],
  ["catalogFilterToolsEnabled", "admin.settings.catalogFilterTools"],
  ["catalogFilterTagsEnabled", "admin.settings.catalogFilterTags"],
] as const satisfies ReadonlyArray<[keyof CatalogFilters, string]>;

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
        catalogFilterEquipmentEnabled: data.catalogFilterEquipmentEnabled ?? false,
        catalogFilterStickersEnabled: data.catalogFilterStickersEnabled ?? false,
        catalogFilterContainersEnabled: data.catalogFilterContainersEnabled ?? false,
        catalogFilterAgentsEnabled: data.catalogFilterAgentsEnabled ?? false,
        catalogFilterCharmsEnabled: data.catalogFilterCharmsEnabled ?? false,
        catalogFilterGraffitiEnabled: data.catalogFilterGraffitiEnabled ?? false,
        catalogFilterPatchesEnabled: data.catalogFilterPatchesEnabled ?? false,
        catalogFilterMusicKitsEnabled: data.catalogFilterMusicKitsEnabled ?? false,
        catalogFilterCollectiblesEnabled: data.catalogFilterCollectiblesEnabled ?? false,
        catalogFilterPassesEnabled: data.catalogFilterPassesEnabled ?? false,
        catalogFilterKeysEnabled: data.catalogFilterKeysEnabled ?? false,
        catalogFilterGiftsEnabled: data.catalogFilterGiftsEnabled ?? false,
        catalogFilterToolsEnabled: data.catalogFilterToolsEnabled ?? false,
        catalogFilterTagsEnabled: data.catalogFilterTagsEnabled ?? false,
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
    const timer = window.setTimeout(() => {
      void loadFilters();
    }, 0);
    return () => window.clearTimeout(timer);
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
  }, [t]);

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

  const allCatalogTypesEnabled = CATEGORY_FILTERS.every(([key]) => filters[key]);
  const setAllCatalogTypes = (enabled: boolean) => {
    setFilters((current) => {
      const next = { ...current };
      for (const [key] of CATEGORY_FILTERS) next[key] = enabled;
      return next;
    });
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
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-xs font-medium shadow-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-[#141124] text-emerald-300"
              : "border-rose-500/30 bg-[#141124] text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded p-0.5 hover:bg-white/10 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AdminSection>
        <div className="max-w-2xl space-y-6">
          {/* Filtros del Catálogo Global */}
          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 sm:p-5">
            <SectionHeader
              title={t("admin.settings.catalogFiltersTitle")}
              desc={t("admin.settings.catalogFiltersDesc")}
            />

            {filtersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-white/[0.06] pb-3">
                    <FilterToggle
                      label={t("admin.settings.catalogFilterAllTypes")}
                      checked={allCatalogTypesEnabled}
                      onChange={setAllCatalogTypes}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="mb-1 text-xs font-semibold text-[#9e98b6]">
                        {t("admin.settings.catalogFilterCategories")}
                      </p>
                      {CATEGORY_FILTERS.slice(0, 10).map(([key, labelKey]) => (
                        <FilterToggle
                          key={key}
                          label={t(labelKey)}
                          checked={filters[key]}
                          onChange={(value) => setFilters((current) => ({ ...current, [key]: value }))}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="mb-1 text-xs font-semibold text-[#9e98b6]">
                        {t("admin.settings.catalogFilterOtherTypes")}
                      </p>
                      {CATEGORY_FILTERS.slice(10).map(([key, labelKey]) => (
                        <FilterToggle
                          key={key}
                          label={t(labelKey)}
                          checked={filters[key]}
                          onChange={(value) => setFilters((current) => ({ ...current, [key]: value }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-white/[0.06] pt-3">
                    <FilterToggle
                      label={t("admin.settings.catalogFilterSouvenir")}
                      checked={filters.catalogFilterSouvenirEnabled}
                      onChange={(v) => setFilters((p) => ({ ...p, catalogFilterSouvenirEnabled: v }))}
                    />
                    <FilterToggle
                      label={t("admin.settings.catalogFilterStatTrak")}
                      checked={filters.catalogFilterStatTrakEnabled}
                      onChange={(v) => setFilters((p) => ({ ...p, catalogFilterStatTrakEnabled: v }))}
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/[0.06] pt-4">
                  <div className="space-y-1.5">
                    <FieldLabel>{t("admin.settings.catalogFilterMinPrice")}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#9e98b6]">$</span>
                      <StyledInput
                        type="number"
                        min={0}
                        step={0.01}
                        value={filters.catalogMinPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFilters((prev) => ({ ...prev, catalogMinPrice: val }));
                        }}
                        className="max-w-28 font-mono tabular-nums"
                      />
                      <span className="font-mono text-xs text-[#9e98b6]">USD</span>
                    </div>
                  </div>

                  <AdminButton
                    type="button"
                    variant="primary"
                    icon={Save}
                    loading={filtersSaving}
                    onClick={handleSaveFilters}
                    disabled={filtersSaving}
                  >
                    {t("admin.settings.saveCatalogFilters")}
                  </AdminButton>

                  {filtersSaved && (
                    <AdminAlert tone="success">{t("admin.settings.catalogFiltersSaved")}</AdminAlert>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sincronización Modular Paso a Paso */}
          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 sm:p-5">
            <SectionHeader
              title={t("admin.settings.stepByStepTitle")}
              desc={t("admin.settings.youpinSyncIntro")}
            />

            <div className="flex flex-col gap-3">
              {/* Paso 1 */}
              <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#141124] p-4">
                <div className="flex items-center justify-between gap-2">
                  <AdminBadge tone="accent">{t("admin.settings.step", { number: 1 })}</AdminBadge>
                  <span className="font-mono text-xs text-[#9e98b6]">items-catalog.json</span>
                </div>
                <p className="text-xs text-[#c2bdd6]">{t("admin.settings.downloadBaseCatalog")}</p>
                {step1Error && <AdminAlert tone="error">{step1Error}</AdminAlert>}
                {step1Result && <AdminAlert tone="success">{step1Result}</AdminAlert>}
                <AdminButton
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={RefreshCw}
                  loading={step1Loading}
                  onClick={handleStep1DownloadCatalog}
                  disabled={step1Loading}
                >
                  {t("admin.settings.step1Button")}
                </AdminButton>
              </div>

              {/* Paso 2 */}
              <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#141124] p-4">
                <div className="flex items-center justify-between gap-2">
                  <AdminBadge tone="info">{t("admin.settings.step", { number: 2 })}</AdminBadge>
                  <span className="font-mono text-xs text-[#9e98b6]">catalog-global.json</span>
                </div>
                <p className="text-xs text-[#c2bdd6]">{t("admin.settings.filterBaseCatalog")}</p>
                {step3Error && <AdminAlert tone="error">{step3Error}</AdminAlert>}
                {step3Result && <AdminAlert tone="success">{step3Result}</AdminAlert>}
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  loading={step3Loading}
                  onClick={handleStep3GenerateCatalogGlobal}
                  disabled={step3Loading}
                >
                  {t("admin.settings.step2Button")}
                </AdminButton>
              </div>

              {/* Paso 3 */}
              <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#141124] p-4">
                <div className="flex items-center justify-between gap-2">
                  <AdminBadge tone="success">{t("admin.settings.step", { number: 3 })}</AdminBadge>
                  <span className="font-mono text-xs text-[#9e98b6]">store/bots</span>
                </div>
                <p className="text-xs text-[#c2bdd6]">{t("admin.settings.applyCatalogPrices")}</p>
                {syncPricesError && <AdminAlert tone="error">{syncPricesError}</AdminAlert>}
                {syncPricesResult && <AdminAlert tone="success">{syncPricesResult}</AdminAlert>}
                <AdminButton
                  type="button"
                  variant="success"
                  size="sm"
                  icon={RefreshCw}
                  loading={syncingPrices}
                  onClick={handleSyncPrices}
                  disabled={syncingPrices}
                >
                  {syncingPrices
                    ? t("admin.settings.applyingBotPrices")
                    : t("admin.settings.applyCatalogPrices")}
                </AdminButton>
              </div>
            </div>
          </div>

          {/* Auto Sync */}
          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 sm:p-5">
            <SectionHeader
              title={t("admin.settings.autoSyncTitle")}
              desc={t("admin.settings.autoSyncDesc")}
            />

            <div className="space-y-4">
              <ToggleSwitch
                label={t("admin.settings.autoSyncEnable")}
                checked={autoSyncEnabled}
                onChange={setAutoSyncEnabled}
              />

              {autoSyncEnabled && (
                <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#141124] p-4">
                  <div className="space-y-1.5">
                    <FieldLabel>{t("admin.settings.autoSyncInterval")}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <StyledInput
                        type="number"
                        min={1}
                        max={120}
                        step={1}
                        value={autoSyncInterval}
                        onChange={(e) => setAutoSyncInterval(parseInt(e.target.value) || 1)}
                        className="max-w-24 font-mono tabular-nums"
                      />
                      <span className="font-mono text-xs text-[#9e98b6]">min</span>
                    </div>
                  </div>

                  {autoSyncStatus && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-white/[0.06] bg-[#1a1630] p-3">
                        <span className="block text-xs text-[#9e98b6]">{t("admin.settings.autoSyncStep")}</span>
                        <span className="mt-0.5 block font-mono text-xs font-semibold text-white">
                          {stepLabel(autoSyncStatus.currentStep)}
                        </span>
                      </div>
                      <div className="rounded-md border border-white/[0.06] bg-[#1a1630] p-3">
                        <span className="block text-xs text-[#9e98b6]">{t("admin.settings.autoSyncLastRun")}</span>
                        <span className="mt-0.5 block font-mono text-xs font-semibold text-white tabular-nums">
                          {autoSyncStatus.lastRunAt ? new Date(autoSyncStatus.lastRunAt).toLocaleTimeString() : t("admin.settings.autoSyncNever")}
                        </span>
                      </div>
                      <div className="rounded-md border border-white/[0.06] bg-[#1a1630] p-3">
                        <span className="block text-xs text-[#9e98b6]">{t("admin.settings.autoSyncNextRun")}</span>
                        <span className="mt-0.5 block font-mono text-xs font-semibold text-white tabular-nums">
                          {autoSyncStatus.nextRunAt ? new Date(autoSyncStatus.nextRunAt).toLocaleTimeString() : "—"}
                        </span>
                      </div>
                      <div className="rounded-md border border-white/[0.06] bg-[#1a1630] p-3">
                        <span className="block text-xs text-[#9e98b6]">{t("admin.settings.autoSyncStatus")}</span>
                        <span className={`mt-0.5 block font-mono text-xs font-semibold ${autoSyncStatus.currentStep !== "idle" ? "text-emerald-400" : "text-[#9e98b6]"}`}>
                          {autoSyncStatus.currentStep !== "idle" ? t("admin.settings.autoSyncRunning") : t("admin.settings.autoSyncIdle")}
                        </span>
                      </div>
                      {autoSyncStatus.lastError && (
                        <div className="sm:col-span-2">
                          <AdminAlert tone="error">{autoSyncStatus.lastError}</AdminAlert>
                        </div>
                      )}
                    </div>
                  )}

                  <AdminButton
                    type="button"
                    variant="primary"
                    icon={Save}
                    loading={autoSyncSaving}
                    onClick={handleSaveAutoSync}
                    disabled={autoSyncSaving}
                  >
                    {t("admin.settings.saveAutoSync")}
                  </AdminButton>

                  {autoSyncSaved && (
                    <AdminAlert tone="success">{t("admin.settings.autoSyncSaved")}</AdminAlert>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Run Now */}
          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 sm:p-5">
            <SectionHeader
              title={t("admin.settings.autoSyncRunNow")}
              desc={t("admin.settings.autoSyncRunNowDesc")}
            />
            <AdminButton
              type="button"
              variant="success"
              icon={Play}
              loading={autoSyncRunning}
              onClick={handleRunAutoSyncNow}
              disabled={autoSyncRunning || autoSyncStatus?.currentStep !== "idle"}
            >
              {autoSyncRunning ? t("admin.settings.autoSyncRunning") : t("admin.settings.autoSyncRunNow")}
            </AdminButton>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
