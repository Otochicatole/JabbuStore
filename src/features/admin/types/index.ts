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
  | "cancelled"
  | "failed"
  // Fases del contrato anterior. Se conservan para poder desplegar frontend y
  // backend de forma independiente.
  | "fetching_youpin"
  | "downloading_assets"
  | "saving_database";

export type MarketSyncCompletionReason =
  | "target_reached"
  | "catalog_exhausted";

export type MarketSyncRunStatus =
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export type MarketSyncEtaConfidence = "high" | "medium" | "low" | "unavailable";

export type MarketSyncCircuitBreakerState = "closed" | "open" | "half_open";

export type MarketSyncRequestPacerStatusView = {
  initialStartsPerSecond: number;
  maximumStartsPerSecond: number;
  currentStartsPerSecond: number;
  queued: number;
  gateState: "closed" | "open";
  gateReason: "congestion" | "rate_limited" | null;
  gateResumeAt: string | null;
};

export type MarketSyncSlowReason =
  | "quota_wait"
  | "provider_latency"
  | "timeouts"
  | "retries"
  | "empty_catalog_results"
  | "adaptive_concurrency"
  | "paused"
  | "publishing_database"
  | "none";

export type MarketSyncRunStatusView = {
  id: string;
  status: MarketSyncRunStatus;
  resumed: boolean;
  attemptCount: number;
  runStartedAt: string;
  attemptStartedAt: string;
  runFinishedAt: string | null;
  lastHeartbeatAt: string;
  elapsed: {
    wallMs: number;
    activeMs: number;
    pausedMs: number;
    quotaWaitMs: number;
    retryBackoffMs: number;
  };
  phases: Array<{
    phase: MarketSyncPhase;
    durationMs: number;
    entryCount: number;
    current: boolean;
  }>;
  requests: {
    pages: number;
    attempts: number;
    succeeded: number;
    failed: number;
    retries: number;
    timeouts: number;
    emptyResponses: number;
    notFound: number;
    rateLimited: number;
    latencyMs: {
      samples: number;
      average: number | null;
      maximum: number | null;
      p95Approx: number | null;
    };
  };
  quota: {
    runUnitsUsed: number;
    creditsUsed: number;
    windowUnitsUsed: number;
    limit: number;
    resetsAt: string | null;
    waitCount: number;
  };
  concurrency: {
    configured: number;
    current: number;
    minimumUsed: number;
    peakInFlight: number;
    reductions: number;
  };
  throughput: {
    validAssetsPerMinute: number | null;
    etaSeconds: number | null;
    etaConfidence: MarketSyncEtaConfidence;
    targetDurationSeconds: number;
    requiredAssetsPerMinute: number;
    onTrack: boolean | null;
    projectedCompletionAt: string | null;
  };
  workers: {
    initial: number;
    max: number;
    effective: number;
    required: number;
    inFlight: number;
    queueDepth: number;
    /** Fracción entre 0 y 1 de los slots efectivos ocupados. */
    utilization: number;
  };
  circuitBreaker: {
    state: MarketSyncCircuitBreakerState;
    openCount: number;
    resumeAt: string | null;
  };
  /** Ritmo de admisión de requests del proveedor; null con backends anteriores. */
  requestPacer: MarketSyncRequestPacerStatusView | null;
  slowReason: MarketSyncSlowReason;
  recommendedPollAfterMs: number;
  deferredCandidateCount: number;
  warnings: string[];
};

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
  /** Diagnóstico durable de la corrida actual; null con backends anteriores. */
  run: MarketSyncRunStatusView | null;
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
