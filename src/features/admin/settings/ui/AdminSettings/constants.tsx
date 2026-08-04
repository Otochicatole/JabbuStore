import {
  Coins,
  CreditCard,
  Handshake,
  KeyRound,
  Landmark,
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
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
  { key: "MARKET_SYNC_PAGE_SIZE", label: "MARKET_SYNC_PAGE_SIZE", type: "number" },
  { key: "MARKET_SYNC_MAX_PAGES", label: "MARKET_SYNC_MAX_PAGES", type: "number" },
];

export const TABS: {
  id: Tab;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "precios", icon: TrendingUp },
  { id: "reventa", icon: Coins },
  { id: "webhook", icon: Webhook },
  { id: "pagos", icon: CreditCard },
  { id: "credenciales", icon: KeyRound },
  { id: "transferencia", icon: Landmark },
  { id: "sync", icon: RefreshCw },
  { id: "homeStats", icon: LayoutDashboard },
  { id: "sponsors", icon: Handshake },
];
