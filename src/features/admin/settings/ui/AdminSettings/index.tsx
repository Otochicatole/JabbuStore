"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

import type { Tab } from "@/features/admin/types";
import { TABS } from "./constants";
import { AdminHeader, AdminPage } from "@/features/admin/ui/AdminShell";

// Sub-components
import { PricingTab } from "./PricingTab";
import { UserSellTab } from "./UserSellTab";
import { ResellTab } from "./ResellTab";
import { PaymentsTab } from "./PaymentsTab";
import { TransferTab } from "./TransferTab";
import { WebhookTab } from "./WebhookTab";
import { CredentialsTab } from "./CredentialsTab";
import { SyncTab } from "./SyncTab";
import { HomeStatsTab } from "./HomeStatsTab";

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

  // Loading/Saving states
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
      homeStats: t("admin.settings.homeStats", { defaultValue: "Estadísticas del Home" }),
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
    };
    return descriptions[tabId] || "";
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSavingResell(false);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  const handleSaveManualTransfer = async () => {
    setSavingManualTransfer(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/manual-transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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

      if (!res.ok) throw new Error("Error guardando settings de transferencia manual");
      
      setSavedManualTransfer(true);
      setTimeout(() => setSavedManualTransfer(false), 2000);
    } catch (error) {
      console.error(error);
      alert("Error guardando configuración de transferencia");
    } finally {
      setSavingManualTransfer(false);
    }
  };

  const handleSaveHomeStats = async () => {
    setSavingHomeStats(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/home-stats`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          homeStatsActiveUsers: settings.homeStatsActiveUsers,
          homeStatsAvailableSkins: settings.homeStatsAvailableSkins,
          homeStatsTransactions: settings.homeStatsTransactions,
          homeStatsOnlineSupport: settings.homeStatsOnlineSupport,
        }),
      });

      if (!res.ok) throw new Error("Error guardando settings de estadísticas del home");
      
      setSavedHomeStats(true);
      setTimeout(() => setSavedHomeStats(false), 2000);
    } catch (error) {
      console.error(error);
      alert("Error guardando estadísticas");
    } finally {
      setSavingHomeStats(false);
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
    <AdminPage>
      <AdminHeader
        title={t("admin.globalSettings")}
        description={t("admin.settings.description")}
      />

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

      {/* Render subcomponents based on activeTab */}
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

      {activeTab === "credenciales" && (
        <CredentialsTab />
      )}

      {activeTab === "transferencia" && (
        <TransferTab
          settings={settings}
          setSettings={setSettings}
          saving={savingManualTransfer}
          saved={savedManualTransfer}
          onSubmit={handleSaveManualTransfer}
        />
      )}

      {activeTab === "sync" && (
        <SyncTab />
      )}

      {activeTab === "homeStats" && (
        <HomeStatsTab
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveHomeStats}
          isSaving={savingHomeStats}
          isSaved={savedHomeStats}
        />
      )}
    </AdminPage>
  );
}
