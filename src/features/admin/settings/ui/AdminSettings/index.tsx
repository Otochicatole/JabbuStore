"use client";

import { useState, useEffect, useMemo } from "react";
import { Settings } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

import type { Tab } from "@/features/admin/types";
import { TABS } from "./constants";
import {
  AdminAlert,
  AdminHeader,
  AdminLoadingState,
  AdminPage,
} from "@/features/admin/ui/AdminShell";

import { PricingTab } from "./PricingTab";
import { UserSellTab } from "./UserSellTab";
import { ResellTab } from "./ResellTab";
import { PaymentsTab } from "./PaymentsTab";
import { TransferTab } from "./TransferTab";
import { WebhookTab } from "./WebhookTab";
import { CredentialsTab } from "./CredentialsTab";
import { SyncTab } from "./SyncTab";
import { HomeStatsTab } from "./HomeStatsTab";
import { SponsorsTab } from "./SponsorsTab";

export interface SettingsState {
  globalPriceModifierType: string;
  globalPriceModifierValue: number;
  globalPriceModifierEnabled: boolean;
  userSellModifierType: string;
  userSellModifierValue: number;
  userSellModifierEnabled: boolean;
  resellModifierType: string;
  resellModifierValue: number;
  resellModifierEnabled: boolean;
  minimumUserSellPrice: number;
  webhookUrl: string;
  usdArsRateKind: "oficial" | "blue" | "cripto";
  mercadoPagoEnabled: boolean;
  paypalEnabled: boolean;
  nowpaymentsEnabled: boolean;
  manualTransferEnabled: boolean;
  manualBankAlias: string;
  manualBankCbu: string;
  manualBankHolder: string;
  manualBankInstructions: string;
  manualCryptoAddress: string;
  manualCryptoNetwork: string;
  manualCryptoInstructions: string;
  homeStatsActiveUsers: string;
  homeStatsAvailableSkins: string;
  homeStatsTransactions: string;
  homeStatsOnlineSupport: string;
}

export function AdminSettings() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("precios");
  const [settings, setSettings] = useState<SettingsState>({
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
    usdArsRateKind: "blue",
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
    homeStatsActiveUsers: "150K+",
    homeStatsAvailableSkins: "45K+",
    homeStatsTransactions: "2.5M+",
    homeStatsOnlineSupport: "24/7",
  });

  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [savingPricing, setSavingPricing] = useState(false);
  const [savingUserSell, setSavingUserSell] = useState(false);
  const [savingResell, setSavingResell] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);
  const [savingManualTransfer, setSavingManualTransfer] = useState(false);
  const [savingHomeStats, setSavingHomeStats] = useState(false);
  const [savedPricing, setSavedPricing] = useState(false);
  const [savedUserSell, setSavedUserSell] = useState(false);
  const [savedResell, setSavedResell] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState(false);
  const [savedManualTransfer, setSavedManualTransfer] = useState(false);
  const [savedHomeStats, setSavedHomeStats] = useState(false);

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
      homeStats: t("admin.settings.homeStats"),
      sponsors: t("admin.settings.sponsors"),
    };
    return labels[tabId] || tabId;
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
      homeStats: t("admin.settings.homeStatsDesc"),
      sponsors: t("admin.settings.sponsorsDesc"),
    };
    return descriptions[tabId] || "";
  };

  const tabGroups = useMemo(
    () => [
      {
        id: "pricing",
        label: t("admin.settings.group.pricing"),
        tabs: TABS.filter((item) => item.id === "precios" || item.id === "reventa"),
      },
      {
        id: "payments",
        label: t("admin.settings.group.payments"),
        tabs: TABS.filter((item) => item.id === "pagos" || item.id === "transferencia"),
      },
      {
        id: "integrations",
        label: t("admin.settings.group.integrations"),
        tabs: TABS.filter(
          (item) => item.id === "credenciales" || item.id === "webhook" || item.id === "sync",
        ),
      },
      {
        id: "storefront",
        label: t("admin.settings.group.storefront"),
        tabs: TABS.filter((item) => item.id === "homeStats" || item.id === "sponsors"),
      },
    ],
    [t],
  );

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

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/pricing`, {
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
      });
      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      setSavedPricing(true);
      setTimeout(() => setSavedPricing(false), 2500);
    } catch (err) {
      console.error(err);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingPricing(false);
    }
  };

  const handleUserSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUserSell(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/user-sell`, {
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
      });
      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      setSavedUserSell(true);
      setTimeout(() => setSavedUserSell(false), 2500);
    } catch (err) {
      console.error(err);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingUserSell(false);
    }
  };

  const handleResellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResell(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/resell`, {
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
      });
      if (!res.ok) throw new Error(t("admin.settings.saveError"));
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
    } catch (err) {
      console.error(err);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingResell(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/webhook-url`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ webhookUrl: settings.webhookUrl || null }),
      });
      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      setSavedWebhook(true);
      setTimeout(() => setSavedWebhook(false), 2500);
    } catch (err) {
      console.error(err);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingWebhook(false);
    }
  };

  const handlePaymentMethodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentMethods(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/payment-methods`, {
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
      });
      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      const conversionRes = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/currency-conversion`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            usdArsRateKind: settings.usdArsRateKind,
          }),
        },
      );
      if (!conversionRes.ok) throw new Error(t("admin.settings.saveError"));
      const saved = await conversionRes.json();
      setSettings((prev) => ({
        ...prev,
        ...saved,
        resellModifierType: saved.resellModifierType ?? saved.marketModifierType ?? prev.resellModifierType,
        resellModifierValue: saved.resellModifierValue ?? saved.marketModifierValue ?? prev.resellModifierValue,
        resellModifierEnabled: saved.resellModifierEnabled ?? saved.marketModifierEnabled ?? prev.resellModifierEnabled,
      }));
      setSavedPaymentMethods(true);
      setTimeout(() => setSavedPaymentMethods(false), 2500);
    } catch (err) {
      console.error(err);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  const handleSaveManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManualTransfer(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/manual-transfer`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({
          manualTransferEnabled: settings.manualTransferEnabled,
          manualBankAlias: settings.manualBankAlias,
          manualBankCbu: settings.manualBankCbu,
          manualBankHolder: settings.manualBankHolder,
          manualBankInstructions: settings.manualBankInstructions,
          manualCryptoAddress: settings.manualCryptoAddress,
          manualCryptoNetwork: settings.manualCryptoNetwork,
          manualCryptoInstructions: settings.manualCryptoInstructions,
        }),
      });

      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      setSavedManualTransfer(true);
      setTimeout(() => setSavedManualTransfer(false), 2000);
    } catch (error) {
      console.error(error);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingManualTransfer(false);
    }
  };

  const handleSaveHomeStats = async () => {
    setSavingHomeStats(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/home-stats`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({
          homeStatsActiveUsers: settings.homeStatsActiveUsers,
          homeStatsAvailableSkins: settings.homeStatsAvailableSkins,
          homeStatsTransactions: settings.homeStatsTransactions,
          homeStatsOnlineSupport: settings.homeStatsOnlineSupport,
        }),
      });

      if (!res.ok) throw new Error(t("admin.settings.saveError"));
      setSavedHomeStats(true);
      setTimeout(() => setSavedHomeStats(false), 2000);
    } catch (error) {
      console.error(error);
      setSaveError(t("admin.settings.saveError"));
    } finally {
      setSavingHomeStats(false);
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <AdminLoadingState label={t("common.loading")} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminHeader
        title={t("admin.globalSettings")}
        description={t("admin.settings.description")}
        icon={Settings}
      />

      {saveError && <AdminAlert>{saveError}</AdminAlert>}

      {/* Mobile horizontal tab strip */}
      <div className="flex gap-1.5 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#141124] p-1.5 lg:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSaveError(null);
                setActiveTab(tab.id);
              }}
              className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-accent text-white font-semibold"
                  : "text-[#a39db9] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {getTabLabel(tab.id)}
            </button>
          );
        })}
      </div>

      {/* Desktop split layout: categorized settings navigation + active panel */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr] lg:items-start">
        <aside className="hidden rounded-lg border border-white/[0.07] bg-[#141124] p-3 lg:block">
          <nav className="space-y-4" aria-label={t("admin.globalSettings")}>
            {tabGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <p className="px-2.5 pb-1 text-[11px] font-semibold text-[#746e8d]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setSaveError(null);
                          setActiveTab(tab.id);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer ${
                          active
                            ? "bg-accent text-white font-semibold"
                            : "text-[#a39db9] font-medium hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{getTabLabel(tab.id)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Context bar */}
          <div className="rounded-lg border border-white/[0.07] bg-[#141124] px-4 py-3 text-xs text-[#9e98b6]">
            {getTabDescription(activeTab)}
          </div>

          {activeTab === "precios" && (
            <PricingTab
              settings={settings}
              setSettings={setSettings}
              saving={savingPricing}
              saved={savedPricing}
              onSubmit={handlePricingSubmit}
            />
          )}

          {activeTab === "venta" && (
            <UserSellTab
              settings={settings}
              setSettings={setSettings}
              saving={savingUserSell}
              saved={savedUserSell}
              onSubmit={handleUserSellSubmit}
            />
          )}

          {activeTab === "reventa" && (
            <ResellTab
              settings={settings}
              setSettings={setSettings}
              saving={savingResell}
              saved={savedResell}
              onSubmit={handleResellSubmit}
            />
          )}

          {activeTab === "webhook" && (
            <WebhookTab
              settings={settings}
              setSettings={setSettings}
              saving={savingWebhook}
              saved={savedWebhook}
              onSubmit={handleWebhookSubmit}
            />
          )}

          {activeTab === "pagos" && (
            <PaymentsTab
              settings={settings}
              setSettings={setSettings}
              saving={savingPaymentMethods}
              saved={savedPaymentMethods}
              onSubmit={handlePaymentMethodsSubmit}
            />
          )}

          {activeTab === "credenciales" && <CredentialsTab />}

          {activeTab === "transferencia" && (
            <TransferTab
              settings={settings}
              setSettings={setSettings}
              saving={savingManualTransfer}
              saved={savedManualTransfer}
              onSubmit={handleSaveManualTransfer}
            />
          )}

          {activeTab === "sync" && <SyncTab />}

          {activeTab === "homeStats" && (
            <HomeStatsTab
              settings={settings}
              setSettings={setSettings}
              onSave={handleSaveHomeStats}
              isSaving={savingHomeStats}
              isSaved={savedHomeStats}
            />
          )}

          {activeTab === "sponsors" && <SponsorsTab />}
        </div>
      </div>
    </AdminPage>
  );
}
