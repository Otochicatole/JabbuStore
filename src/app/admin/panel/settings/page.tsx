"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Check,
  TrendingUp,
  Users,
  ShieldCheck,
  Webhook,
  Coins,
  RefreshCw,
  Landmark,
  CreditCard,
  KeyRound,
  Eye,
  Trash2,
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";

const MODIFIER_OPTIONS = [
  { value: "percentage_increase", label: "Aumento en Porcentaje (+%)" },
  { value: "percentage_decrease", label: "Descuento en Porcentaje (-%)" },
  { value: "fixed_increase", label: "Aumento Fijo (+USD)" },
  { value: "fixed_decrease", label: "Descuento Fijo (-USD)" },
];

type Tab = "precios" | "venta" | "reventa" | "limites" | "pagos" | "credenciales" | "transferencia" | "webhook" | "sync";

type PriceCatalogStatus = {
  exists: boolean;
  stale: boolean;
  fetchedAt: string | null;
  itemCount: number;
  pageCount: number;
  currency: string;
  market: string;
  lastError?: string;
  running?: boolean;
  lastStartedAt?: string | null;
  lastFinishedAt?: string | null;
  lastItemCount?: number | null;
  triggeredBy?: string | null;
};

type SecretStatus = {
  key: string;
  configured: boolean;
  source: "database" | "env" | "missing";
  last4: string | null;
  updatedAt: string | null;
};

const SECRET_LABELS = [
  { key: "STEAM_API_KEY", label: "STEAM_API_KEY" },
  { key: "STEAMWEBAPI_API_KEY", label: "STEAMWEBAPI_API_KEY" },
  { key: "MERCADOPAGO_ACCESS_TOKEN", label: "MERCADOPAGO_ACCESS_TOKEN" },
  { key: "MERCADOPAGO_WEBHOOK_SECRET", label: "MERCADOPAGO_WEBHOOK_SECRET" },
  { key: "NOWPAYMENTS_API_KEY", label: "NOWPAYMENTS_API_KEY" },
  { key: "NOWPAYMENTS_IPN_SECRET", label: "NOWPAYMENTS_IPN_SECRET" },
  { key: "PAYPAL_CLIENT_ID", label: "PAYPAL_CLIENT_ID" },
  { key: "PAYPAL_CLIENT_SECRET", label: "PAYPAL_CLIENT_SECRET" },
  { key: "PAYPAL_SANDBOX", label: "PAYPAL_SANDBOX" },
];

const RUNTIME_CONFIG_LABELS = [
  { key: "ENABLE_SYNC", label: "ENABLE_SYNC", type: "boolean" },
  { key: "STORE_SYNC_INTERVAL_MINUTES", label: "STORE_SYNC_INTERVAL_MINUTES", type: "number" },
  { key: "ENABLE_ITEMS_CATALOG_SYNC", label: "ENABLE_ITEMS_CATALOG_SYNC", type: "boolean" },
  { key: "ITEMS_CATALOG_SYNC_INTERVAL_MINUTES", label: "ITEMS_CATALOG_SYNC_INTERVAL_MINUTES", type: "number" },
  { key: "MARKET_SYNC_PAGE_SIZE", label: "MARKET_SYNC_PAGE_SIZE", type: "number" },
  { key: "MARKET_SYNC_MAX_PAGES", label: "MARKET_SYNC_MAX_PAGES", type: "number" },
  { key: "MARKET_SYNC_MIN_PRICE", label: "MARKET_SYNC_MIN_PRICE", type: "number" },
  { key: "MARKET_SYNC_SORT", label: "MARKET_SYNC_SORT", type: "text" },
  { key: "FLOAT_SYNC_SORT", label: "FLOAT_SYNC_SORT", type: "text" },
];

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  {
    id: "precios",
    label: "Precios Globales",
    icon: TrendingUp,
    desc: "Modificadores automáticos de precio",
  },
  {
    id: "venta",
    label: "Reglas de Venta",
    icon: Users,
    desc: "Comisiones sobre ventas de usuarios",
  },
  {
    id: "reventa",
    label: "Reglas de Reventa",
    icon: Coins,
    desc: "Modificadores para ítems de Youpin (reventas)",
  },
  {
    id: "limites",
    label: "Límites",
    icon: ShieldCheck,
    desc: "Restricciones mínimas de venta",
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: Webhook,
    desc: "Notificaciones en tiempo real",
  },
  {
    id: "pagos",
    label: "Pagos",
    icon: CreditCard,
    desc: "Habilitar o deshabilitar pasarelas de pago",
  },
  {
    id: "credenciales",
    label: "Credenciales",
    icon: KeyRound,
    desc: "Secretos cifrados de APIs y pasarelas",
  },
  {
    id: "transferencia",
    label: "Transferencia",
    icon: Landmark,
    desc: "Datos bancarios y cripto para pagos manuales",
  },
  {
    id: "sync",
    label: "Sincronización",
    icon: RefreshCw,
    desc: "Sincronización manual completa del catálogo y bots",
  },
];

/* ── Small reusable components ── */
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-black uppercase tracking-wider text-white">
        {title}
      </h2>
      <p className="text-xs text-[#84849b] mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
      {children}
    </label>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
    />
  );
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full min-h-28 px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all resize-y"
    />
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function SaveButton({
  saving,
  saved,
  label,
}: {
  saving: boolean;
  saved: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      className="mt-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.25)] hover:shadow-[0_4px_30px_rgba(217,70,239,0.4)] disabled:opacity-60 cursor-pointer"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
      ) : null}
      {saving ? "Guardando..." : saved ? "¡Guardado!" : label}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/5 rounded-full border border-white/10 peer peer-checked:bg-accent peer-checked:border-accent/50 transition-all" />
        <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
      </div>
      <span className="text-sm text-white/80 font-semibold">{label}</span>
    </label>
  );
}


/* ══════════════════════════════════════════════ */
export default function AdminSettingsPage() {
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
        throw new Error(data.error || "Error al sincronizar el servidor.");
      }
      setSyncResult(data.message || "Sincronización completa finalizada con éxito.");
      
      const now = Date.now();
      localStorage.setItem("last_sync_timestamp", String(now));
      setCooldownLeft(180); // 3 minutos
    } catch (err: unknown) {
      setSyncError(getErrorMessage(err, "Error al sincronizar la aplicación."));
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
        throw new Error(data.error || "Error al cargar estado de credenciales.");
      }
      setSecretStatuses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, "Error al cargar estado de credenciales."));
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
        throw new Error(data.error || "Error al cargar configuración runtime.");
      }
      setRuntimeConfig(data);
    } catch (err: unknown) {
      setRuntimeConfigMessage(getErrorMessage(err, "Error al cargar configuración runtime."));
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
        throw new Error(data.error || "Error al guardar credencial.");
      }
      setSecretDrafts((prev) => ({ ...prev, [key]: "" }));
      setSecretMessage("Credencial guardada correctamente.");
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, "Error al guardar credencial."));
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
        throw new Error(data.error || "Error al revelar credencial.");
      }
      setRevealedSecrets((prev) => ({ ...prev, [key]: data.value || "" }));
      setSecretMessage("Credencial revelada. No la compartas.");
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, "Error al revelar credencial."));
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
        throw new Error(data.error || "Error al eliminar credencial.");
      }
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSecretMessage("Credencial cifrada eliminada. Si existe en .env, seguirá funcionando como fallback.");
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, "Error al eliminar credencial."));
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
        throw new Error(data.error || "Error al guardar configuración runtime.");
      }
      setRuntimeConfig(data);
      setRuntimeConfigMessage("Configuración guardada. Los cambios de scheduler aplican al reiniciar el backend.");
    } catch (err: unknown) {
      setRuntimeConfigMessage(getErrorMessage(err, "Error al guardar configuración runtime."));
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
        throw new Error(data.error || "Error al obtener estado del catálogo.");
      }
      setCatalogStatus(data);
      setCatalogError(null);
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, "Error al obtener estado del catálogo."));
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
        setCatalogError(data.message || "Ya hay una descarga del catálogo en curso.");
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar catálogo de precios.");
      }
      setCatalogStatus(data.catalog ?? null);
      setSyncPricesResult(data.message || "Descarga del catálogo iniciada en segundo plano.");
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setCatalogError(data.errors.join(" | "));
      }
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, "Error al actualizar catálogo de precios."));
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
        throw new Error(data.error || "Error al sincronizar precios de los bots.");
      }
      setSyncPricesResult(
        data.message ||
          "Sincronización de precios iniciada en segundo plano. Refrescá la tienda en unos minutos.",
      );
      void fetchCatalogStatus();
    } catch (err: unknown) {
      setSyncPricesError(getErrorMessage(err, "Error al sincronizar precios."));
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
            title="Reglas Globales de Precios"
            desc="Define cómo se modifican automáticamente los precios de todos los artículos en la tienda."
          />
          <form onSubmit={handlePricingSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.globalPriceModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, globalPriceModifierEnabled: v })
              }
              label="Habilitar Modificador Global"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.globalPriceModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, globalPriceModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
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
              label="Guardar Reglas de Precio"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Venta ── */}
      {activeTab === "venta" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Reglas de Venta de Usuarios"
            desc="Define cómo se modifican los precios cuando un usuario te vende items desde su inventario."
          />
          <form onSubmit={handleUserSellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.userSellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, userSellModifierEnabled: v })
              }
              label="Habilitar Modificador de Venta"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.userSellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, userSellModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
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
              label="Guardar Reglas de Venta"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Reventa ── */}
      {activeTab === "reventa" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Reglas de Reventa SteamWebAPI"
            desc="Define cómo se modifican los precios para las skins bajo pedido traídas de Youpin."
          />
          <form onSubmit={handleResellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.resellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, resellModifierEnabled: v })
              }
              label="Habilitar Modificador de Reventa"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.resellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, resellModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
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
              label="Guardar Reglas de Reventa"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Límites ── */}
      {activeTab === "limites" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Límites de Venta"
            desc="Establecé restricciones mínimas para las ventas que los usuarios pueden realizar en la plataforma."
          />
          <form onSubmit={handleMinSellSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <FieldLabel>Precio Mínimo de Venta (USD)</FieldLabel>
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
                Los usuarios no podrán listar skins por debajo de este monto.
              </p>
            </div>
            <SaveButton
              saving={savingMinSell}
              saved={savedMinSell}
              label="Guardar Precio Mínimo"
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
                Esta contraseña no se guarda en la DB. Vive en `.env` y se usa para autorizar acciones sensibles.
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
                          {busy ? "..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRevealSecret(key)}
                          disabled={busy || !masterPassword}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSecret(key)}
                          disabled={busy || !masterPassword}
                          className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Borrar
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
            title="Métodos de Pago"
            desc="Definí qué pasarelas externas pueden elegir los compradores durante el checkout."
          />
          <form onSubmit={handlePaymentMethodsSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.mercadoPagoEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, mercadoPagoEnabled: v })
                  }
                  label="Habilitar Mercado Pago"
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  Si está deshabilitado, no aparece en checkout y el backend rechaza nuevas órdenes con este método.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.paypalEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, paypalEnabled: v })
                  }
                  label="Habilitar PayPal"
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  Controla el checkout de PayPal sin afectar credenciales ni webhooks existentes.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <ToggleSwitch
                  checked={settings.nowpaymentsEnabled}
                  onChange={(v) =>
                    setSettings({ ...settings, nowpaymentsEnabled: v })
                  }
                  label="Habilitar NOWPayments"
                />
                <p className="text-[10px] text-[#84849b] mt-2 font-mono">
                  Controla pagos cripto por NOWPayments. La transferencia manual cripto se configura aparte.
                </p>
              </div>
            </div>

            <SaveButton
              saving={savingPaymentMethods}
              saved={savedPaymentMethods}
              label="Guardar Métodos de Pago"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Transferencia Manual ── */}
      {activeTab === "transferencia" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Transferencia Manual"
            desc="Configurá los datos que verá el comprador para pagar manualmente por transferencia bancaria o cripto."
          />
          <form onSubmit={handleManualTransferSubmit} className="space-y-6 max-w-3xl">
            <ToggleSwitch
              checked={settings.manualTransferEnabled}
              onChange={(v) =>
                setSettings({ ...settings, manualTransferEnabled: v })
              }
              label="Habilitar Transferencia Manual en Checkout"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Transferencia Bancaria
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
                  <FieldLabel>Titular</FieldLabel>
                  <StyledInput
                    value={settings.manualBankHolder || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, manualBankHolder: e.target.value })
                    }
                    placeholder="Nombre o razón social"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Instrucciones Bancarias</FieldLabel>
                  <StyledTextarea
                    value={settings.manualBankInstructions || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualBankInstructions: e.target.value,
                      })
                    }
                    placeholder="Indicaciones visibles para el comprador antes de adjuntar comprobante."
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Transferencia Cripto
                </h3>
                <div className="space-y-1.5">
                  <FieldLabel>Dirección de Wallet</FieldLabel>
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
                  <FieldLabel>Red</FieldLabel>
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
                  <FieldLabel>Instrucciones Cripto</FieldLabel>
                  <StyledTextarea
                    value={settings.manualCryptoInstructions || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manualCryptoInstructions: e.target.value,
                      })
                    }
                    placeholder="Moneda esperada, red correcta, confirmaciones necesarias, etc."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[3px]">
              <p className="text-[10px] text-amber-100/80 font-bold uppercase tracking-wider leading-relaxed">
                El checkout manual queda pendiente hasta revisión del admin. El usuario debe adjuntar comprobante para crear la orden.
              </p>
            </div>

            <SaveButton
              saving={savingManualTransfer}
              saved={savedManualTransfer}
              label="Guardar Transferencia Manual"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Webhook ── */}
      {activeTab === "webhook" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Notificaciones vía Webhook"
            desc="Configurá una URL externa para recibir notificaciones HTTP en tiempo real cada vez que ocurra una compra o venta."
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
                Tu servidor recibirá un{" "}
                <span className="text-white font-bold">POST</span> con los
                detalles del pedido, datos del cliente y método de pago en
                formato JSON.
              </p>
            </div>

            {/* Info card */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] space-y-1.5 rounded-[3px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                Eventos disparados
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
              label="Guardar Webhook"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Sincronización ── */}
      {activeTab === "sync" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px] space-y-6">
          <SectionHeader
            title="Sincronización Manual Completa"
            desc="Fuerza una sincronización en tiempo real de todo el sistema. Esto actualizará el catálogo de mercado de YouPin y el inventario en stock de todos los bots conectados."
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
                Procesos Ejecutados:
              </h3>
              <ul className="text-xs text-[#84849b] list-disc list-inside space-y-1.5 font-medium">
                <li>Catálogo YouPin vía <span className="text-white break-all">/steam/api/float/assets</span> (assets con float).</li>
                <li>Persistencia de <span className="text-white">FloatItem</span> + listings agrupados.</li>
                <li>Inventario de bots Steam + inspect links + precios YouPin.</li>
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
                  ? "Sincronizando catálogo e inventario..."
                  : cooldownLeft > 0
                  ? `Espera ${Math.floor(cooldownLeft / 60)}m ${cooldownLeft % 60}s`
                  : "Sincronizar catálogo + inventario bots"}
              </button>

              {cooldownLeft > 0 && (
                <span className="text-[10px] text-[#84849b] font-mono font-bold uppercase tracking-wider self-center">
                  * Cooldown activo para evitar saturar las APIs (3 minutos)
                </span>
              )}
            </div>

            <hr className="border-white/5 my-6" />

            <div className="space-y-4">
              <SectionHeader
                title="Catálogo Local de Precios"
                desc="Descarga SteamWebAPI /steam/api/items y guarda el JSON local usado para asignar precios a bots."
              />

              {catalogStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                    <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                      Items en catálogo
                    </p>
                    <p className="text-lg font-black text-white">
                      {catalogStatus.itemCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                    <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                      Última actualización
                    </p>
                    <p className="text-xs font-bold text-white">
                      {catalogStatus.fetchedAt
                        ? new Date(catalogStatus.fetchedAt).toLocaleString()
                        : "Sin catálogo"}
                    </p>
                  </div>
                  <div className="p-4 bg-white/3 border border-white/10 rounded-[3px]">
                    <p className="text-[10px] uppercase tracking-wider text-[#84849b] font-black">
                      Estado
                    </p>
                    <p className={`text-xs font-black ${catalogStatus.running ? "text-sky-400" : catalogStatus.stale ? "text-amber-400" : "text-emerald-400"}`}>
                      {catalogStatus.running
                        ? "Descargando"
                        : catalogStatus.exists
                        ? catalogStatus.stale
                          ? "Desactualizado"
                          : "Listo"
                        : "No existe"}
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
                    ? "Descargando precios desde API..."
                    : "Descargar catálogo de precios"}
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
                    ? "Aplicando precios a bots..."
                    : "Aplicar precios del catálogo a bots"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
