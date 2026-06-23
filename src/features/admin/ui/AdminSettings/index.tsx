"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";

import type { Tab, PriceCatalogStatus, SecretStatus } from "@/features/admin/types";
import { SECRET_LABELS, RUNTIME_CONFIG_LABELS, TABS } from "./constants";
import {
  FieldLabel,
  SaveButton,
  SectionHeader,
  StyledInput,
  StyledTextarea,
  ToggleSwitch,
} from "./FormControls";
import { getErrorMessage } from "./helpers";

/* ══════════════════════════════════════════════ */
export function AdminSettings() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("precios");
  const getTabLabel = (tabId: Tab) => {
    const labels: Record<Tab, string> = {
      precios: t("admin.settings.pricing"),
      venta: t("admin.settings.userSell"),
      reventa: t("admin.settings.resell"),
      limites: t("admin.settings.limits"),
      pagos: t("admin.settings.payments"),
      credenciales: t("admin.settings.credentials"),
      transferencia: t("admin.settings.transfer"),
      webhook: t("admin.settings.webhook"),
      sync: t("admin.settings.sync"),
    };
    return labels[tabId];
  };
  const getTabDescription = (tabId: Tab) => {
    const descriptions: Record<Tab, string> = {
      precios: t("admin.settings.pricingDesc"),
      venta: t("admin.settings.userSellDesc"),
      reventa: t("admin.settings.resellDesc"),
      limites: t("admin.settings.limitsDesc"),
      pagos: t("admin.settings.paymentsDesc"),
      credenciales: t("admin.settings.credentialsDesc"),
      transferencia: t("admin.settings.transferDesc"),
      webhook: t("admin.settings.webhookDesc"),
      sync: t("admin.settings.syncDesc"),
    };
    return descriptions[tabId];
  };
  const modifierOptions = [
    { value: "percentage_increase", label: t("admin.settings.modifier.percentageIncrease") },
    { value: "percentage_decrease", label: t("admin.settings.modifier.percentageDecrease") },
    { value: "fixed_increase", label: t("admin.settings.modifier.fixedIncrease") },
    { value: "fixed_decrease", label: t("admin.settings.modifier.fixedDecrease") },
  ];

  const [settings, setSettings] = useState({
    globalPriceModifierType: "percentage_increase",
    globalPriceModifierValue: 0,
    globalPriceModifierEnabled: false,
    userSellModifierType: "percentage_decrease",
    userSellModifierValue: 0,
    userSellModifierEnabled: false,
    resellModifierType: "percentage_increase",
    resellModifierValue: 0,
    resellModifierEnabled: false,
    minimumUserSellPrice: 1.0,
    webhookUrl: "",
    mercadoPagoEnabled: true,
    paypalEnabled: true,
    nowpaymentsEnabled: true,
    manualTransferEnabled: false,
    manualBankAlias: "",
    manualBankCbu: "",
    manualBankHolder: "",
    manualBankInstructions: "",
    manualCryptoAddress: "",
    manualCryptoNetwork: "",
    manualCryptoInstructions: "",
  });

  const [loading, setLoading] = useState(true);

  const [savingPricing, setSavingPricing] = useState(false);
  const [savingUserSell, setSavingUserSell] = useState(false);
  const [savingResell, setSavingResell] = useState(false);
  const [savingMinSell, setSavingMinSell] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);
  const [savingManualTransfer, setSavingManualTransfer] = useState(false);
  const [savedPricing, setSavedPricing] = useState(false);
  const [savedUserSell, setSavedUserSell] = useState(false);
  const [savedResell, setSavedResell] = useState(false);
  const [savedMinSell, setSavedMinSell] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState(false);
  const [savedManualTransfer, setSavedManualTransfer] = useState(false);

  const [secretStatuses, setSecretStatuses] = useState<SecretStatus[]>([]);
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [masterPassword, setMasterPassword] = useState("");
  const [secretMessage, setSecretMessage] = useState<string | null>(null);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [savingSecretKey, setSavingSecretKey] = useState<string | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<Record<string, string>>({});
  const [savingRuntimeConfig, setSavingRuntimeConfig] = useState(false);
  const [runtimeConfigMessage, setRuntimeConfigMessage] = useState<string | null>(null);

  // --- States for Manual Sync and 3-Minute Cooldown ---
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("last_sync_timestamp");
      if (saved) {
        const diff = Date.now() - Number(saved);
        const remaining = Math.max(0, Math.ceil((3 * 60 * 1000 - diff) / 1000));
        setCooldownLeft(remaining);
      }
    }, 0);
    return () => window.clearTimeout(timer);
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

  // --- States for Manual Bot Price Sync ---
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [syncPricesResult, setSyncPricesResult] = useState<string | null>(null);
  const [syncPricesError, setSyncPricesError] = useState<string | null>(null);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState<PriceCatalogStatus | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const fetchSecretsStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/status`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.loadSecretsError"));
      }
      setSecretStatuses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.loadSecretsError")));
    }
  };

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

  const handleSaveSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({
          value: secretDrafts[key] || "",
          password: masterPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.saveSecretError"));
      }
      setSecretDrafts((prev) => ({ ...prev, [key]: "" }));
      setSecretMessage(t("admin.settings.secretSaved"));
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.saveSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

  const handleRevealSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}/reveal`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.revealSecretError"));
      }
      setRevealedSecrets((prev) => ({ ...prev, [key]: data.value || "" }));
      setSecretMessage(t("admin.settings.secretRevealed"));
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.revealSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.deleteSecretError"));
      }
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSecretMessage(t("admin.settings.secretDeleted"));
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.deleteSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

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



  useEffect(() => {
    fetch(`${BACKEND_URL}/admin/marketplace/settings`, {
      credentials: "include",
      cache: "no-store",
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            resellModifierType:
              data.resellModifierType ?? data.marketModifierType ?? prev.resellModifierType,
            resellModifierValue:
              data.resellModifierValue ?? data.marketModifierValue ?? prev.resellModifierValue,
            resellModifierEnabled:
              data.resellModifierEnabled ?? data.marketModifierEnabled ?? prev.resellModifierEnabled,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCatalogStatus();
      void fetchSecretsStatus();
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

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/pricing`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            globalPriceModifierType: settings.globalPriceModifierType,
            globalPriceModifierValue: Number(settings.globalPriceModifierValue),
            globalPriceModifierEnabled: settings.globalPriceModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedPricing(true);
      setTimeout(() => setSavedPricing(false), 2500);
    } finally {
      setSavingPricing(false);
    }
  };

  const handleUserSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUserSell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/user-sell`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            userSellModifierType: settings.userSellModifierType,
            userSellModifierValue: Number(settings.userSellModifierValue),
            userSellModifierEnabled: settings.userSellModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedUserSell(true);
      setTimeout(() => setSavedUserSell(false), 2500);
    } finally {
      setSavingUserSell(false);
    }
  };

  const handleResellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/resell`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            resellModifierType: settings.resellModifierType,
            resellModifierValue: Number(settings.resellModifierValue),
            resellModifierEnabled: settings.resellModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setSettings((prev) => ({
        ...prev,
        ...saved,
        resellModifierType: saved.resellModifierType ?? saved.marketModifierType,
        resellModifierValue: saved.resellModifierValue ?? saved.marketModifierValue,
        resellModifierEnabled: saved.resellModifierEnabled ?? saved.marketModifierEnabled,
      }));
      setSavedResell(true);
      setTimeout(() => setSavedResell(false), 2500);
    } finally {
      setSavingResell(false);
    }
  };

  const handleMinSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMinSell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/minimum-sell-price`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            minimumUserSellPrice: Number(settings.minimumUserSellPrice),
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedMinSell(true);
      setTimeout(() => setSavedMinSell(false), 2500);
    } finally {
      setSavingMinSell(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/webhook-url`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({ webhookUrl: settings.webhookUrl || null }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedWebhook(true);
      setTimeout(() => setSavedWebhook(false), 2500);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handlePaymentMethodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentMethods(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/payment-methods`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            mercadoPagoEnabled: settings.mercadoPagoEnabled,
            paypalEnabled: settings.paypalEnabled,
            nowpaymentsEnabled: settings.nowpaymentsEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setSettings((prev) => ({
        ...prev,
        ...saved,
        resellModifierType: saved.resellModifierType ?? saved.marketModifierType ?? prev.resellModifierType,
        resellModifierValue: saved.resellModifierValue ?? saved.marketModifierValue ?? prev.resellModifierValue,
        resellModifierEnabled: saved.resellModifierEnabled ?? saved.marketModifierEnabled ?? prev.resellModifierEnabled,
      }));
      setSavedPaymentMethods(true);
      setTimeout(() => setSavedPaymentMethods(false), 2500);
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  const handleManualTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManualTransfer(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/manual-transfer`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            manualTransferEnabled: settings.manualTransferEnabled,
            manualBankAlias: settings.manualBankAlias || null,
            manualBankCbu: settings.manualBankCbu || null,
            manualBankHolder: settings.manualBankHolder || null,
            manualBankInstructions: settings.manualBankInstructions || null,
            manualCryptoAddress: settings.manualCryptoAddress || null,
            manualCryptoNetwork: settings.manualCryptoNetwork || null,
            manualCryptoInstructions: settings.manualCryptoInstructions || null,
          }),
        },
      );
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setSettings((prev) => ({
        ...prev,
        ...saved,
        resellModifierType: saved.resellModifierType ?? saved.marketModifierType ?? prev.resellModifierType,
        resellModifierValue: saved.resellModifierValue ?? saved.marketModifierValue ?? prev.resellModifierValue,
        resellModifierEnabled: saved.resellModifierEnabled ?? saved.marketModifierEnabled ?? prev.resellModifierEnabled,
      }));
      setSavedManualTransfer(true);
      setTimeout(() => setSavedManualTransfer(false), 2500);
    } finally {
      setSavingManualTransfer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">
          {t("admin.globalSettings")}
        </h1>
        <p className="text-xs text-[#84849b] mt-1">
          {t("admin.settings.description")}
        </p>
      </div>

      {/* Tab bar - Horizontal scrollable on mobile */}
      <div className="flex gap-2 bg-[#110f1e]/40 p-1 rounded-[3px] border border-white/5 overflow-x-auto scrollbar-none shrink-0 flex-nowrap sm:flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[3px] text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 justify-center
                ${
                  active
                    ? "bg-accent text-white shadow-[0_4px_20px_rgba(217,70,239,0.35)]"
                    : "text-[#84849b] hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "opacity-100" : "opacity-60"}`}
              />
              {getTabLabel(tab.id)}
            </button>
          );
        })}
      </div>

      {/* Tab description strip */}
      <div className="flex items-start sm:items-center gap-2 px-4 py-2.5 bg-accent/5 border border-accent/15 rounded-[3px]">
        {(() => {
          const activeTabConfig = TABS.find((tab) => tab.id === activeTab)!;
          const Icon = activeTabConfig.icon;
          return (
            <>
              <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-xs text-accent/80 font-semibold min-w-0">
                {getTabDescription(activeTab)}
              </span>
            </>
          );
        })()}
      </div>

      {/* ── TAB: Precios Globales ── */}
      {activeTab === "precios" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.globalPriceRules")}
            desc={t("admin.settings.globalPriceRulesDesc")}
          />
          <form onSubmit={handlePricingSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.globalPriceModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, globalPriceModifierEnabled: v })
              }
              label={t("admin.settings.enableGlobalModifier")}
            />
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.modifierType")}</FieldLabel>
              <AdminSelect
                value={settings.globalPriceModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, globalPriceModifierType: v })
                }
                options={modifierOptions}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.value")}</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.globalPriceModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    globalPriceModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingPricing}
              saved={savedPricing}
              label={t("admin.settings.savePriceRules")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Venta ── */}
      {activeTab === "venta" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.userSellRulesTitle")}
            desc={t("admin.settings.userSellRulesDesc")}
          />
          <form onSubmit={handleUserSellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.userSellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, userSellModifierEnabled: v })
              }
              label={t("admin.settings.enableSellModifier")}
            />
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.modifierType")}</FieldLabel>
              <AdminSelect
                value={settings.userSellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, userSellModifierType: v })
                }
                options={modifierOptions}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.value")}</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.userSellModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    userSellModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingUserSell}
              saved={savedUserSell}
              label={t("admin.settings.saveSellRules")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Reventa ── */}
      {activeTab === "reventa" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.resellRulesTitle")}
            desc={t("admin.settings.resellRulesDesc")}
          />
          <form onSubmit={handleResellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.resellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, resellModifierEnabled: v })
              }
              label={t("admin.settings.enableResellModifier")}
            />
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.modifierType")}</FieldLabel>
              <AdminSelect
                value={settings.resellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, resellModifierType: v })
                }
                options={modifierOptions}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.value")}</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.resellModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resellModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingResell}
              saved={savedResell}
              label={t("admin.settings.saveResellRules")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Límites ── */}
      {activeTab === "limites" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.sellLimitsTitle")}
            desc={t("admin.settings.sellLimitsDesc")}
          />
          <form onSubmit={handleMinSellSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.minimumSellPriceUsd")}</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60 text-sm font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={settings.minimumUserSellPrice}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minimumUserSellPrice: Number(e.target.value),
                    })
                  }
                  className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <p className="text-[10px] text-[#84849b] font-mono">
                {t("admin.settings.minimumSellPriceHelp")}
              </p>
            </div>
            <SaveButton
              saving={savingMinSell}
              saved={savedMinSell}
              label={t("admin.settings.saveMinimumPrice")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Credenciales ── */}
      {activeTab === "credenciales" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.credentialsTitle")}
            desc={t("admin.settings.credentialsDescription")}
          />

          <div className="max-w-4xl space-y-5">
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.masterPassword")}</FieldLabel>
              <StyledInput
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="ADMIN_SECRETS_PASSWORD"
                autoComplete="off"
              />
              <p className="text-[10px] text-[#84849b] font-mono">
                {t("admin.settings.masterPasswordHelp")}
              </p>
            </div>

            {secretError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold rounded-[3px]">
                {secretError}
              </div>
            )}
            {secretMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-[3px]">
                {secretMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {SECRET_LABELS.map(({ key, label }) => {
                const status = secretStatuses.find((item) => item.key === key);
                const busy = savingSecretKey === key;

                return (
                  <div key={key} className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          {label}
                        </h3>
                        <p className="text-[10px] text-[#84849b] font-mono">
                          {status?.configured
                            ? `${t("admin.settings.configured")} (${status.source})${status.last4 ? ` · ${status.last4}` : ""}`
                            : t("admin.settings.notConfigured")}
                        </p>
                      </div>
                      <span className={`w-fit px-2 py-1 rounded-[3px] text-[9px] font-black uppercase tracking-wider ${
                        status?.configured
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-300 border border-red-500/20"
                      }`}>
                        {status?.configured ? t("admin.settings.active") : t("admin.settings.missing")}
                      </span>
                    </div>

                    {revealedSecrets[key] && (
                      <div className="p-3 bg-black/20 border border-white/5 rounded-[3px]">
                        <p className="text-[9px] text-[#84849b] uppercase font-black mb-1">
                          {t("admin.settings.revealedValue")}
                        </p>
                        <p className="text-xs text-white font-mono break-all select-all">
                          {revealedSecrets[key]}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
                      <StyledInput
                        type="password"
                        value={secretDrafts[key] || ""}
                        onChange={(e) =>
                          setSecretDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={t("admin.settings.newValue")}
                        autoComplete="off"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveSecret(key)}
                          disabled={busy || !secretDrafts[key] || !masterPassword}
                          className="px-3 py-2 bg-accent text-white rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {busy ? "..." : t("common.save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRevealSecret(key)}
                          disabled={busy || !masterPassword}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {t("common.view")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSecret(key)}
                          disabled={busy || !masterPassword}
                          className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Métodos de Pago ── */}
      {activeTab === "pagos" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.paymentsTitle")}
            desc={t("admin.settings.paymentsTitleDesc")}
          />
          <form onSubmit={handlePaymentMethodsSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.mercadoPagoEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, mercadoPagoEnabled: v })
                  }
                  label={t("admin.settings.enableMercadoPago")}
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  {t("admin.settings.mercadoPagoHelp")}
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.paypalEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, paypalEnabled: v })
                  }
                  label={t("admin.settings.enablePaypal")}
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  {t("admin.settings.paypalHelp")}
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.nowpaymentsEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, nowpaymentsEnabled: v })
                  }
                  label={t("admin.settings.enableNowpayments")}
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  {t("admin.settings.nowpaymentsHelp")}
                </p>
              </div>
            </div>

            <SaveButton
              saving={savingPaymentMethods}
              saved={savedPaymentMethods}
              label={t("admin.settings.savePayments")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Transferencia Manual ── */}
      {activeTab === "transferencia" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.manualTransferTitle")}
            desc={t("admin.settings.manualTransferDesc")}
          />
          <form onSubmit={handleManualTransferSubmit} className="space-y-6 max-w-3xl">
            <ToggleSwitch
              checked={settings.manualTransferEnabled}
              onChange={(v) =>
                setSettings({ ...settings, manualTransferEnabled: v })
              }
              label={t("admin.settings.enableManualTransfer")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {t("admin.settings.bankTransfer")}
                </h3>
                <div className="space-y-1.5">
                  <FieldLabel>Alias</FieldLabel>
                  <StyledInput
                    value={settings.manualBankAlias || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, manualBankAlias: e.target.value })
                    }
                    placeholder="ej. jabbu.store.mp"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>CBU / CVU</FieldLabel>
                  <StyledInput
                    value={settings.manualBankCbu || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, manualBankCbu: e.target.value })
                    }
                    placeholder="0000003100012345678901"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("checkout.accountHolder")}</FieldLabel>
                  <StyledInput
                    value={settings.manualBankHolder || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, manualBankHolder: e.target.value })
                    }
                    placeholder={t("admin.settings.bankHolderPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("admin.settings.bankInstructions")}</FieldLabel>
                  <StyledTextarea
                    value={settings.manualBankInstructions || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualBankInstructions: e.target.value,
                      })
                    }
                    placeholder={t("admin.settings.bankInstructionsPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {t("admin.settings.cryptoTransfer")}
                </h3>
                <div className="space-y-1.5">
                  <FieldLabel>{t("checkout.walletAddress")}</FieldLabel>
                  <StyledInput
                    value={settings.manualCryptoAddress || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualCryptoAddress: e.target.value,
                      })
                    }
                    placeholder="0x... / TRC20 / BTC / etc."
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("checkout.network")}</FieldLabel>
                  <StyledInput
                    value={settings.manualCryptoNetwork || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualCryptoNetwork: e.target.value,
                      })
                    }
                    placeholder="USDT TRC20, ERC20, BTC..."
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("admin.settings.cryptoInstructions")}</FieldLabel>
                  <StyledTextarea
                    value={settings.manualCryptoInstructions || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualCryptoInstructions: e.target.value,
                      })
                    }
                    placeholder={t("admin.settings.cryptoInstructionsPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[3px]">
              <p className="text-[10px] text-amber-100/80 font-bold uppercase tracking-wider leading-relaxed">
                {t("admin.settings.manualTransferWarning")}
              </p>
            </div>

            <SaveButton
              saving={savingManualTransfer}
              saved={savedManualTransfer}
              label={t("admin.settings.saveManualTransfer")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Webhook ── */}
      {activeTab === "webhook" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title={t("admin.settings.webhookTitle")}
            desc={t("admin.settings.webhookDescFull")}
          />
          <form onSubmit={handleWebhookSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <FieldLabel>Webhook URL</FieldLabel>
              <StyledInput
                type="url"
                placeholder="https://tu-servidor.com/webhook"
                value={settings.webhookUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, webhookUrl: e.target.value })
                }
                style={{ fontFamily: "monospace" }}
              />
              <p className="text-[10px] text-[#84849b] font-mono leading-relaxed">
                {t("admin.settings.webhookHelp")}
              </p>
            </div>

            {/* Info card */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] space-y-1.5 rounded-[3px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                {t("admin.settings.triggeredEvents")}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["order.created", "order.status_updated"].map((ev) => (
                  <span
                    key={ev}
                    className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono rounded-[3px]"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            <SaveButton
              saving={savingWebhook}
              saved={savedWebhook}
              label={t("admin.settings.saveWebhook")}
            />
          </form>
        </div>
      )}

      {/* ── TAB: Sincronización ── */}
      {activeTab === "sync" && (
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

            {/* Error notifications */}
            {syncError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-[3px]">
                {syncError}
              </div>
            )}

            {/* Success notifications */}
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
      )}
    </div>
  );
}


