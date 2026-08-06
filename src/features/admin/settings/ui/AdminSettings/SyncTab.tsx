"use client";

import React, { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";

import { getErrorMessage } from "./helpers";

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
      <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px] space-y-6">


        
        <div className="max-w-xl w-full space-y-6">
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

        </div>
      </div>
    </div>
  );
}
