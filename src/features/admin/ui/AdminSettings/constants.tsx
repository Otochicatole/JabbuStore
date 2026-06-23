import {
  Coins,
  CreditCard,
  KeyRound,
  Landmark,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Webhook,
} from "lucide-react";

import type { Tab } from "@/features/admin/types";

export const SECRET_LABELS = [
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

export const RUNTIME_CONFIG_LABELS = [
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

export const TABS: {
  id: Tab;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "precios", icon: TrendingUp },
  { id: "venta", icon: Users },
  { id: "reventa", icon: Coins },
  { id: "limites", icon: ShieldCheck },
  { id: "webhook", icon: Webhook },
  { id: "pagos", icon: CreditCard },
  { id: "credenciales", icon: KeyRound },
  { id: "transferencia", icon: Landmark },
  { id: "sync", icon: RefreshCw },
];
