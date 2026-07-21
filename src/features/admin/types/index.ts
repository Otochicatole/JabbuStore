import type { LucideIcon } from "lucide-react";

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

export type Tab =
  | "precios"
  | "venta"
  | "reventa"
  | "limites"
  | "pagos"
  | "credenciales"
  | "transferencia"
  | "webhook"
  | "sync"
  | "homeStats"
  | "sponsors";

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
  currentPage?: number;
  currentItemCount?: number;
  totalPages?: number;
  path?: string;
};

export type MarketSyncPhase =
  | "idle"
  | "refreshing_items_catalog"
  | "building_priority_queue"
  | "collecting_assets"
  | "waiting_rate_limit"
  | "validating_snapshot"
  | "saving_snapshot"
  | "publishing_database"
  | "syncing_bots"
  | "paused"
  | "completed"
  | "failed"
  // Fases del contrato anterior. Se conservan para poder desplegar frontend y
  // backend de forma independiente.
  | "fetching_youpin"
  | "downloading_assets"
  | "saving_database";

export type MarketSyncCompletionReason =
  | "target_reached"
  | "catalog_exhausted";

export type LastPublishedMarketSnapshotStatus = {
  snapshotHash: string;
  rawAssets: number;
  validAssets: number;
  skippedAssets: number;
  publishedListings: number;
  publishedFloats: number;
  publishedAt: string | null;
  successfulAt: string | null;
  completionReason: MarketSyncCompletionReason | null;
};

export type MarketSyncStatus = {
  running: boolean;
  resumable: boolean;
  phase: MarketSyncPhase;
  triggeredBy: string | null;
  message: string | null;
  targetAssets: number;
  requestedAssets: number;
  rawAssets: number;
  validAssets: number;
  skippedAssets: number;
  totalCandidates: number;
  candidatesVisited: number;
  currentCandidate: string | null;
  assetsPerItem: number;
  quotaUnitsUsed: number;
  quotaLimit: number;
  creditsUsed: number | null;
  quotaResetsAt: string | null;
  publishedListings: number;
  publishedFloats: number;
  lastPublished: LastPublishedMarketSnapshotStatus | null;
  snapshotHash: string | null;
  snapshotFetchedAt: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessfulAt: string | null;
  lastError: string | null;
  completionReason: MarketSyncCompletionReason | null;
  itemsCatalog: {
    fetchedAt: string | null;
    itemCount: number;
    currentPage: number;
    totalPages: number;
    running: boolean;
  } | null;
  // Campos de compatibilidad que todavía pueden venir del backend anterior.
  rowsUsed?: number;
  rateLimitResetsAt?: string | null;
  listingsProcessed?: number;
  totalListings?: number;
  floatsIndexed?: number;
  currentPage?: number;
  maxPages?: number;
};

export type MarketSyncTriggerResponse = {
  started: boolean;
  message: string;
  statusUrl?: string;
  status?: MarketSyncStatus;
};

export type SecretStatus = {
  key: string;
  configured: boolean;
  source: "database" | "env" | "missing";
  last4: string | null;
  updatedAt: string | null;
};
