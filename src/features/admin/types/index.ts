import type { LucideIcon } from "lucide-react";
import type { StoreItem, AdminUser as DomainAdminUser } from "../domain/types";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminDashboardClientProps {
  initialItems: StoreItem[];
  adminUser: DomainAdminUser;
}

export type Tab =
  | "precios"
  | "venta"
  | "reventa"
  | "limites"
  | "pagos"
  | "credenciales"
  | "transferencia"
  | "webhook"
  | "sync";

export type PriceCatalogStatus = {
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

export type SecretStatus = {
  key: string;
  configured: boolean;
  source: "database" | "env" | "missing";
  last4: string | null;
  updatedAt: string | null;
};
