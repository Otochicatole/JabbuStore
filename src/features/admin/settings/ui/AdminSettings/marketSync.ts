import type {
  MarketSyncCompletionReason,
  MarketSyncCircuitBreakerState,
  MarketSyncEtaConfidence,
  MarketSyncPhase,
  MarketSyncRequestPacerStatusView,
  MarketSyncRunStatus,
  MarketSyncRunStatusView,
  MarketSyncSlowReason,
  MarketSyncStatus,
  PriceCatalogStatus,
} from "@/features/admin/types";

export const DEFAULT_MARKET_SYNC_TARGET = 10_000;

export type MarketSyncPollingHint = {
  phase?: MarketSyncPhase;
  quotaResetsAt?: string | null;
  recommendedPollAfterMs?: number;
};

export const MARKET_SYNC_PHASE_LABEL_KEYS: Record<MarketSyncPhase, string> = {
  idle: "admin.settings.syncPhase.idle",
  refreshing_items_catalog: "admin.settings.syncPhase.refreshingItemsCatalog",
  building_priority_queue: "admin.settings.syncPhase.buildingPriorityQueue",
  collecting_assets: "admin.settings.syncPhase.collectingAssets",
  waiting_rate_limit: "admin.settings.syncPhase.waitingRateLimit",
  validating_snapshot: "admin.settings.syncPhase.validatingSnapshot",
  saving_snapshot: "admin.settings.syncPhase.savingSnapshot",
  publishing_database: "admin.settings.syncPhase.publishingDatabase",
  syncing_bots: "admin.settings.syncPhase.syncingBots",
  paused: "admin.settings.syncPhase.paused",
  completed: "admin.settings.syncPhase.completed",
  cancelled: "admin.settings.syncPhase.cancelled",
  failed: "admin.settings.syncPhase.failed",
  fetching_youpin: "admin.settings.syncPhase.collectingAssets",
  downloading_assets: "admin.settings.syncPhase.collectingAssets",
  saving_database: "admin.settings.syncPhase.publishingDatabase",
};

export const MARKET_SYNC_WARNING_KEYS: Readonly<Record<string, string>> = {
  heartbeat_stale: "admin.settings.syncWarning.heartbeatStale",
  high_timeout_rate: "admin.settings.syncWarning.highTimeoutRate",
  deferred_candidates: "admin.settings.syncWarning.deferredCandidates",
  eta_low_confidence: "admin.settings.syncWarning.etaLowConfidence",
  quota_window_near_limit: "admin.settings.syncWarning.quotaWindowNearLimit",
  ten_minute_target_unreachable:
    "admin.settings.syncWarning.tenMinuteTargetUnreachable",
};

const MARKET_SYNC_PHASES = new Set<MarketSyncPhase>([
  "idle",
  "refreshing_items_catalog",
  "building_priority_queue",
  "collecting_assets",
  "waiting_rate_limit",
  "validating_snapshot",
  "saving_snapshot",
  "publishing_database",
  "syncing_bots",
  "paused",
  "completed",
  "cancelled",
  "failed",
  "fetching_youpin",
  "downloading_assets",
  "saving_database",
]);

const COMPLETION_REASONS = new Set<MarketSyncCompletionReason>([
  "target_reached",
  "catalog_exhausted",
]);

const RUN_STATUSES = new Set<MarketSyncRunStatus>([
  "running",
  "paused",
  "completed",
  "cancelled",
  "failed",
]);

const ETA_CONFIDENCE_VALUES = new Set<MarketSyncEtaConfidence>([
  "high",
  "medium",
  "low",
  "unavailable",
]);

const CIRCUIT_BREAKER_STATES = new Set<MarketSyncCircuitBreakerState>([
  "closed",
  "open",
  "half_open",
]);

const REQUEST_PACER_GATE_STATES = new Set<
  MarketSyncRequestPacerStatusView["gateState"]
>(["closed", "open"]);

const REQUEST_PACER_GATE_REASONS = new Set<
  NonNullable<MarketSyncRequestPacerStatusView["gateReason"]>
>(["congestion", "rate_limited"]);

const SLOW_REASONS = new Set<MarketSyncSlowReason>([
  "quota_wait",
  "provider_latency",
  "timeouts",
  "retries",
  "empty_catalog_results",
  "adaptive_concurrency",
  "paused",
  "publishing_database",
  "none",
]);

export function marketSyncBasePollingDelay(phase: MarketSyncPhase | undefined) {
  if (phase === "collecting_assets" || phase === "downloading_assets") return 5_000;
  if (
    phase === "validating_snapshot" ||
    phase === "saving_snapshot" ||
    phase === "publishing_database" ||
    phase === "saving_database"
  ) {
    return 2_000;
  }
  if (phase === "waiting_rate_limit" || phase === "paused") return 10_000;
  return 2_000;
}

export function marketSyncPollingDelay(
  hint: MarketSyncPollingHint,
  nowMs = Date.now(),
) {
  const recommended = hint.recommendedPollAfterMs ?? 0;
  if (recommended > 0) return Math.min(30_000, Math.max(1_000, recommended));
  if (hint.phase !== "waiting_rate_limit" && hint.phase !== "paused") {
    return marketSyncBasePollingDelay(hint.phase);
  }

  const resetTimestamp = hint.quotaResetsAt
    ? Date.parse(hint.quotaResetsAt)
    : Number.NaN;
  if (!Number.isFinite(resetTimestamp)) return 10_000;

  const remaining = resetTimestamp - nowMs;
  return remaining > 0
    ? Math.min(30_000, Math.max(5_000, remaining + 250))
    : 5_000;
}

export function shouldPollMarketSyncStatus(status: MarketSyncStatus | null) {
  if (status === null) return true;
  if (status.phase === "waiting_rate_limit") return true;
  if (
    status.phase === "failed" ||
    status.phase === "completed" ||
    status.phase === "cancelled" ||
    status.phase === "paused"
  ) {
    return false;
  }
  return Boolean(status.running || status.run?.status === "running");
}

const CANCELLABLE_MARKET_SYNC_PHASES = new Set<MarketSyncPhase>([
  "collecting_assets",
  "waiting_rate_limit",
]);

export function canCancelMarketSync(status: MarketSyncStatus | null) {
  return Boolean(
    status?.running && CANCELLABLE_MARKET_SYNC_PHASES.has(status.phase),
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return fallback;
}

function nullableString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function nonNegativeNumber(
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number {
  return Math.max(0, numberValue(record, keys, fallback));
}

function nullableNumber(
  record: Record<string, unknown>,
  key: string,
  fallback: number | null,
): number | null {
  if (!(key in record)) return fallback;
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : null;
}

function nullableStringField(
  record: Record<string, unknown>,
  key: string,
  fallback: string | null,
): string | null {
  return key in record ? nullableString(record, [key]) : fallback;
}

function unitInterval(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  return Math.min(1, Math.max(0, numberValue(record, [key], fallback)));
}

function normalizeMarketSyncRequestPacer(
  value: unknown,
  fallback: MarketSyncRequestPacerStatusView | null,
): MarketSyncRequestPacerStatusView | null {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return fallback;

  const record = asRecord(value);
  const rawInitial = record.initialStartsPerSecond;
  const rawMaximum = record.maximumStartsPerSecond;
  const rawCurrent = record.currentStartsPerSecond;
  const hasValidInitial =
    typeof rawInitial === "number" &&
    Number.isFinite(rawInitial) &&
    rawInitial > 0;
  const hasValidMaximum =
    typeof rawMaximum === "number" &&
    Number.isFinite(rawMaximum) &&
    rawMaximum > 0;
  const hasValidCurrent =
    typeof rawCurrent === "number" &&
    Number.isFinite(rawCurrent) &&
    rawCurrent > 0;

  if (
    fallback === null &&
    (!hasValidInitial || !hasValidMaximum || !hasValidCurrent)
  ) {
    return null;
  }

  const maximumStartsPerSecond = hasValidMaximum
    ? rawMaximum
    : fallback?.maximumStartsPerSecond ?? 0;
  const initialStartsPerSecond = Math.min(
    hasValidInitial ? rawInitial : fallback?.initialStartsPerSecond ?? 0,
    maximumStartsPerSecond,
  );
  const currentStartsPerSecond = Math.min(
    hasValidCurrent ? rawCurrent : fallback?.currentStartsPerSecond ?? 0,
    maximumStartsPerSecond,
  );
  const queuedValue = record.queued;
  const queued =
    typeof queuedValue === "number" && Number.isFinite(queuedValue)
      ? Math.floor(Math.max(0, queuedValue))
      : fallback?.queued ?? 0;
  const gateStateValue = record.gateState;
  let gateState =
    typeof gateStateValue === "string" &&
    REQUEST_PACER_GATE_STATES.has(
      gateStateValue as MarketSyncRequestPacerStatusView["gateState"],
    )
      ? (gateStateValue as MarketSyncRequestPacerStatusView["gateState"])
      : fallback?.gateState ?? "closed";
  const gateReasonValue = record.gateReason;
  let gateReason =
    gateReasonValue === null
      ? null
      : typeof gateReasonValue === "string" &&
          REQUEST_PACER_GATE_REASONS.has(
            gateReasonValue as NonNullable<
              MarketSyncRequestPacerStatusView["gateReason"]
            >,
          )
        ? (gateReasonValue as NonNullable<
            MarketSyncRequestPacerStatusView["gateReason"]
          >)
        : fallback?.gateReason ?? null;
  let gateResumeAt = nullableStringField(
    record,
    "gateResumeAt",
    fallback?.gateResumeAt ?? null,
  );

  if (gateState === "closed") {
    gateReason = null;
    gateResumeAt = null;
  } else if (
    gateReason === null ||
    gateResumeAt === null ||
    !Number.isFinite(Date.parse(gateResumeAt))
  ) {
    const fallbackGateIsOpen =
      fallback?.gateState === "open" &&
      fallback.gateReason !== null &&
      fallback.gateResumeAt !== null &&
      Number.isFinite(Date.parse(fallback.gateResumeAt));
    if (fallbackGateIsOpen && fallback) {
      gateState = fallback.gateState;
      gateReason = fallback.gateReason;
      gateResumeAt = fallback.gateResumeAt;
    } else {
      gateState = "closed";
      gateReason = null;
      gateResumeAt = null;
    }
  }

  return {
    initialStartsPerSecond,
    maximumStartsPerSecond,
    currentStartsPerSecond,
    queued,
    gateState,
    gateReason,
    gateResumeAt,
  };
}

export function normalizeMarketSyncRun(
  value: unknown,
  fallback?: MarketSyncRunStatusView | null,
): MarketSyncRunStatusView | null {
  const record = asRecord(value);
  const id = nullableString(record, ["id"]) ?? fallback?.id ?? null;
  if (!id) return fallback ?? null;

  const base = fallback?.id === id ? fallback : null;
  const statusValue = record.status;
  const status =
    typeof statusValue === "string" && RUN_STATUSES.has(statusValue as MarketSyncRunStatus)
      ? (statusValue as MarketSyncRunStatus)
      : base?.status ?? "running";
  const elapsed = asRecord(record.elapsed);
  const requests = asRecord(record.requests);
  const latency = asRecord(requests.latencyMs);
  const quota = asRecord(record.quota);
  const concurrency = asRecord(record.concurrency);
  const throughput = asRecord(record.throughput);
  const workers = asRecord(record.workers);
  const circuitBreaker = asRecord(record.circuitBreaker);
  const requestPacer =
    "requestPacer" in record
      ? normalizeMarketSyncRequestPacer(
          record.requestPacer,
          base?.requestPacer ?? null,
        )
      : base?.requestPacer ?? null;
  const etaConfidenceValue = throughput.etaConfidence;
  const etaConfidence =
    typeof etaConfidenceValue === "string" &&
    ETA_CONFIDENCE_VALUES.has(etaConfidenceValue as MarketSyncEtaConfidence)
      ? (etaConfidenceValue as MarketSyncEtaConfidence)
      : base?.throughput.etaConfidence ?? "unavailable";
  const slowReasonValue = record.slowReason;
  const slowReason =
    typeof slowReasonValue === "string" &&
    SLOW_REASONS.has(slowReasonValue as MarketSyncSlowReason)
      ? (slowReasonValue as MarketSyncSlowReason)
      : base?.slowReason ?? "none";
  const phases = Array.isArray(record.phases)
    ? record.phases.flatMap((item) => {
        const phaseRecord = asRecord(item);
        const phase = phaseRecord.phase;
        if (
          typeof phase !== "string" ||
          !MARKET_SYNC_PHASES.has(phase as MarketSyncPhase)
        ) {
          return [];
        }
        return [{
          phase: phase as MarketSyncPhase,
          durationMs: nonNegativeNumber(phaseRecord, ["durationMs"]),
          entryCount: nonNegativeNumber(phaseRecord, ["entryCount"]),
          current: phaseRecord.current === true,
        }];
      })
    : base?.phases ?? [];
  const warnings = Array.isArray(record.warnings)
    ? record.warnings.filter((item): item is string => typeof item === "string")
    : base?.warnings ?? [];
  const circuitBreakerStateValue = circuitBreaker.state;
  const circuitBreakerState =
    typeof circuitBreakerStateValue === "string" &&
    CIRCUIT_BREAKER_STATES.has(
      circuitBreakerStateValue as MarketSyncCircuitBreakerState,
    )
      ? (circuitBreakerStateValue as MarketSyncCircuitBreakerState)
      : base?.circuitBreaker.state ?? "closed";
  const configuredConcurrency = nonNegativeNumber(
    concurrency,
    ["configured"],
    base?.concurrency.configured ?? 0,
  );
  const currentConcurrency = nonNegativeNumber(
    concurrency,
    ["current"],
    base?.concurrency.current ?? 0,
  );

  return {
    id,
    status,
    resumed:
      typeof record.resumed === "boolean" ? record.resumed : base?.resumed ?? false,
    attemptCount: nonNegativeNumber(record, ["attemptCount"], base?.attemptCount ?? 1),
    runStartedAt:
      nullableString(record, ["runStartedAt"]) ?? base?.runStartedAt ?? "",
    attemptStartedAt:
      nullableString(record, ["attemptStartedAt"]) ?? base?.attemptStartedAt ?? "",
    runFinishedAt: nullableStringField(
      record,
      "runFinishedAt",
      base?.runFinishedAt ?? null,
    ),
    lastHeartbeatAt:
      nullableString(record, ["lastHeartbeatAt"]) ?? base?.lastHeartbeatAt ?? "",
    elapsed: {
      wallMs: nonNegativeNumber(elapsed, ["wallMs"], base?.elapsed.wallMs ?? 0),
      activeMs: nonNegativeNumber(elapsed, ["activeMs"], base?.elapsed.activeMs ?? 0),
      pausedMs: nonNegativeNumber(elapsed, ["pausedMs"], base?.elapsed.pausedMs ?? 0),
      quotaWaitMs: nonNegativeNumber(
        elapsed,
        ["quotaWaitMs"],
        base?.elapsed.quotaWaitMs ?? 0,
      ),
      retryBackoffMs: nonNegativeNumber(
        elapsed,
        ["retryBackoffMs"],
        base?.elapsed.retryBackoffMs ?? 0,
      ),
    },
    phases,
    requests: {
      pages: nonNegativeNumber(requests, ["pages"], base?.requests.pages ?? 0),
      attempts: nonNegativeNumber(requests, ["attempts"], base?.requests.attempts ?? 0),
      succeeded: nonNegativeNumber(requests, ["succeeded"], base?.requests.succeeded ?? 0),
      failed: nonNegativeNumber(requests, ["failed"], base?.requests.failed ?? 0),
      retries: nonNegativeNumber(requests, ["retries"], base?.requests.retries ?? 0),
      timeouts: nonNegativeNumber(requests, ["timeouts"], base?.requests.timeouts ?? 0),
      emptyResponses: nonNegativeNumber(
        requests,
        ["emptyResponses"],
        base?.requests.emptyResponses ?? 0,
      ),
      notFound: nonNegativeNumber(requests, ["notFound"], base?.requests.notFound ?? 0),
      rateLimited: nonNegativeNumber(
        requests,
        ["rateLimited"],
        base?.requests.rateLimited ?? 0,
      ),
      latencyMs: {
        samples: nonNegativeNumber(latency, ["samples"], base?.requests.latencyMs.samples ?? 0),
        average: nullableNumber(latency, "average", base?.requests.latencyMs.average ?? null),
        maximum: nullableNumber(latency, "maximum", base?.requests.latencyMs.maximum ?? null),
        p95Approx: nullableNumber(
          latency,
          "p95Approx",
          base?.requests.latencyMs.p95Approx ?? null,
        ),
      },
    },
    quota: {
      runUnitsUsed: nonNegativeNumber(quota, ["runUnitsUsed"], base?.quota.runUnitsUsed ?? 0),
      creditsUsed: nonNegativeNumber(quota, ["creditsUsed"], base?.quota.creditsUsed ?? 0),
      windowUnitsUsed: nonNegativeNumber(
        quota,
        ["windowUnitsUsed"],
        base?.quota.windowUnitsUsed ?? 0,
      ),
      limit: nonNegativeNumber(quota, ["limit"], base?.quota.limit ?? 0),
      resetsAt: nullableStringField(quota, "resetsAt", base?.quota.resetsAt ?? null),
      waitCount: nonNegativeNumber(quota, ["waitCount"], base?.quota.waitCount ?? 0),
    },
    concurrency: {
      configured: configuredConcurrency,
      current: currentConcurrency,
      minimumUsed: nonNegativeNumber(
        concurrency,
        ["minimumUsed"],
        base?.concurrency.minimumUsed ?? 0,
      ),
      peakInFlight: nonNegativeNumber(
        concurrency,
        ["peakInFlight"],
        base?.concurrency.peakInFlight ?? 0,
      ),
      reductions: nonNegativeNumber(
        concurrency,
        ["reductions"],
        base?.concurrency.reductions ?? 0,
      ),
    },
    throughput: {
      validAssetsPerMinute: nullableNumber(
        throughput,
        "validAssetsPerMinute",
        base?.throughput.validAssetsPerMinute ?? null,
      ),
      etaSeconds: nullableNumber(
        throughput,
        "etaSeconds",
        base?.throughput.etaSeconds ?? null,
      ),
      etaConfidence,
      targetDurationSeconds: nonNegativeNumber(
        throughput,
        ["targetDurationSeconds"],
        base?.throughput.targetDurationSeconds ?? 600,
      ),
      requiredAssetsPerMinute: nonNegativeNumber(
        throughput,
        ["requiredAssetsPerMinute"],
        base?.throughput.requiredAssetsPerMinute ?? 0,
      ),
      onTrack:
        typeof throughput.onTrack === "boolean"
          ? throughput.onTrack
          : base?.throughput.onTrack ?? null,
      projectedCompletionAt: nullableStringField(
        throughput,
        "projectedCompletionAt",
        base?.throughput.projectedCompletionAt ?? null,
      ),
    },
    workers: {
      initial: nonNegativeNumber(
        workers,
        ["initial"],
        base?.workers.initial ?? Math.min(6, configuredConcurrency),
      ),
      max: nonNegativeNumber(
        workers,
        ["max"],
        base?.workers.max ?? configuredConcurrency,
      ),
      effective: nonNegativeNumber(
        workers,
        ["effective"],
        base?.workers.effective ?? currentConcurrency,
      ),
      required: nonNegativeNumber(
        workers,
        ["required"],
        base?.workers.required ?? 0,
      ),
      inFlight: nonNegativeNumber(
        workers,
        ["inFlight"],
        base?.workers.inFlight ?? 0,
      ),
      queueDepth: nonNegativeNumber(
        workers,
        ["queueDepth"],
        base?.workers.queueDepth ?? 0,
      ),
      utilization: unitInterval(
        workers,
        "utilization",
        base?.workers.utilization ?? 0,
      ),
    },
    circuitBreaker: {
      state: circuitBreakerState,
      openCount: nonNegativeNumber(
        circuitBreaker,
        ["openCount"],
        base?.circuitBreaker.openCount ?? 0,
      ),
      resumeAt: nullableStringField(
        circuitBreaker,
        "resumeAt",
        base?.circuitBreaker.resumeAt ?? null,
      ),
    },
    requestPacer,
    slowReason,
    recommendedPollAfterMs: nonNegativeNumber(
      record,
      ["recommendedPollAfterMs"],
      base?.recommendedPollAfterMs ?? 0,
    ),
    deferredCandidateCount: nonNegativeNumber(
      record,
      ["deferredCandidateCount"],
      base?.deferredCandidateCount ?? 0,
    ),
    warnings,
  };
}

function booleanValue(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  return typeof record[key] === "boolean" ? record[key] : fallback;
}

function stringValue(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  return typeof record[key] === "string" ? record[key] : fallback;
}

function hasPriceCatalogShape(record: Record<string, unknown>): boolean {
  return ["exists", "stale", "fetchedAt", "itemCount", "running"].some(
    (key) => key in record,
  );
}

export function normalizePriceCatalogStatus(
  value: unknown,
  fallback?: PriceCatalogStatus | null,
): PriceCatalogStatus {
  const record = asRecord(value);

  return {
    exists: booleanValue(record, "exists", fallback?.exists ?? false),
    stale: booleanValue(record, "stale", fallback?.stale ?? false),
    fetchedAt:
      "fetchedAt" in record
        ? nullableString(record, ["fetchedAt"])
        : fallback?.fetchedAt ?? null,
    itemCount: numberValue(record, ["itemCount"], fallback?.itemCount ?? 0),
    pageCount: numberValue(record, ["pageCount"], fallback?.pageCount ?? 0),
    currency: stringValue(record, "currency", fallback?.currency ?? "USD"),
    market: stringValue(record, "market", fallback?.market ?? "steam"),
    lastError:
      "lastError" in record
        ? nullableString(record, ["lastError"]) ?? undefined
        : fallback?.lastError,
    running: booleanValue(record, "running", fallback?.running ?? false),
    lastStartedAt:
      "lastStartedAt" in record
        ? nullableString(record, ["lastStartedAt"])
        : fallback?.lastStartedAt ?? null,
    lastFinishedAt:
      "lastFinishedAt" in record
        ? nullableString(record, ["lastFinishedAt"])
        : fallback?.lastFinishedAt ?? null,
    lastItemCount:
      typeof record.lastItemCount === "number" && Number.isFinite(record.lastItemCount)
        ? record.lastItemCount
        : fallback?.lastItemCount ?? null,
    triggeredBy:
      "triggeredBy" in record
        ? nullableString(record, ["triggeredBy"])
        : fallback?.triggeredBy ?? null,
    currentPage: numberValue(record, ["currentPage"], fallback?.currentPage ?? 0),
    currentItemCount: numberValue(
      record,
      ["currentItemCount"],
      fallback?.currentItemCount ?? 0,
    ),
    totalPages: numberValue(record, ["totalPages"], fallback?.totalPages ?? 0),
    path: stringValue(record, "path", fallback?.path ?? ""),
  };
}

export function priceCatalogStatusFromTriggerResponse(
  value: unknown,
  fallback?: PriceCatalogStatus | null,
): PriceCatalogStatus | null {
  const record = asRecord(value);
  const candidates = [record.status, record.catalog, record.previousCatalog, value];

  for (const candidate of candidates) {
    const candidateRecord = asRecord(candidate);
    if (hasPriceCatalogShape(candidateRecord)) {
      return normalizePriceCatalogStatus(candidateRecord, fallback);
    }
  }

  return null;
}

export function createAcceptedPriceCatalogStatus(
  fallback?: PriceCatalogStatus | null,
): PriceCatalogStatus {
  return normalizePriceCatalogStatus(
    {
      running: true,
      lastStartedAt: new Date().toISOString(),
      currentPage: 0,
      currentItemCount: 0,
      lastError: null,
    },
    fallback,
  );
}

export function normalizeMarketSyncStatus(
  value: unknown,
  fallback?: MarketSyncStatus | null,
): MarketSyncStatus {
  const record = asRecord(value);
  const phaseValue = record.phase;
  const phase =
    typeof phaseValue === "string" && MARKET_SYNC_PHASES.has(phaseValue as MarketSyncPhase)
      ? (phaseValue as MarketSyncPhase)
      : fallback?.phase ?? "idle";
  const targetAssets = numberValue(
    record,
    ["targetAssets", "requestedAssets"],
    fallback?.targetAssets || DEFAULT_MARKET_SYNC_TARGET,
  );
  const rowsUsed = numberValue(
    record,
    ["quotaUnitsUsed", "rowsUsed"],
    fallback?.quotaUnitsUsed ?? 0,
  );
  const completionValue = record.completionReason;
  const completionReason =
    typeof completionValue === "string" &&
    COMPLETION_REASONS.has(completionValue as MarketSyncCompletionReason)
      ? (completionValue as MarketSyncCompletionReason)
      : null;
  const itemsCatalogRecord = asRecord(record.itemsCatalog);
  const hasItemsCatalog =
    record.itemsCatalog !== null &&
    typeof record.itemsCatalog === "object";
  const lastPublishedRecord = asRecord(record.lastPublished);
  const hasLastPublished =
    record.lastPublished !== null &&
    typeof record.lastPublished === "object" &&
    typeof lastPublishedRecord.snapshotHash === "string";
  const run = record.run === null
    ? null
    : record.run !== null && typeof record.run === "object"
      ? normalizeMarketSyncRun(record.run, fallback?.run)
      : fallback?.run ?? null;

  return {
    running:
      typeof record.running === "boolean" ? record.running : fallback?.running ?? false,
    resumable:
      typeof record.resumable === "boolean"
        ? record.resumable
        : fallback?.resumable ?? false,
    phase,
    triggeredBy: nullableString(record, ["triggeredBy"]) ?? fallback?.triggeredBy ?? null,
    message: nullableString(record, ["message"]) ?? fallback?.message ?? null,
    targetAssets,
    requestedAssets: numberValue(
      record,
      ["requestedAssets", "targetAssets"],
      fallback?.requestedAssets || targetAssets,
    ),
    rawAssets: numberValue(record, ["rawAssets", "rawAssetCount"], fallback?.rawAssets ?? 0),
    validAssets: numberValue(
      record,
      ["validAssets", "validAssetCount"],
      fallback?.validAssets ?? 0,
    ),
    skippedAssets: numberValue(
      record,
      ["skippedAssets", "skippedAssetCount"],
      fallback?.skippedAssets ?? 0,
    ),
    totalCandidates: numberValue(
      record,
      ["totalCandidates", "maxPages"],
      fallback?.totalCandidates ?? 0,
    ),
    candidatesVisited: numberValue(
      record,
      ["candidatesVisited", "currentPage"],
      fallback?.candidatesVisited ?? 0,
    ),
    currentCandidate:
      nullableString(record, ["currentCandidate"]) ?? fallback?.currentCandidate ?? null,
    assetsPerItem: numberValue(record, ["assetsPerItem"], fallback?.assetsPerItem || 10),
    quotaUnitsUsed: rowsUsed,
    quotaLimit: numberValue(record, ["quotaLimit"], fallback?.quotaLimit || 10_000),
    creditsUsed:
      typeof record.creditsUsed === "number" && Number.isFinite(record.creditsUsed)
        ? record.creditsUsed
        : fallback?.creditsUsed ?? null,
    quotaResetsAt:
      nullableString(record, ["quotaResetsAt", "rateLimitResetsAt"]) ??
      fallback?.quotaResetsAt ??
      null,
    publishedListings: numberValue(
      record,
      ["publishedListings", "publishedListingCount", "listingsProcessed", "totalListings"],
      fallback?.publishedListings ?? 0,
    ),
    publishedFloats: numberValue(
      record,
      ["publishedFloats", "publishedFloatCount", "floatsIndexed"],
      fallback?.publishedFloats ?? 0,
    ),
    lastPublished: hasLastPublished
      ? {
          snapshotHash: String(lastPublishedRecord.snapshotHash),
          rawAssets: numberValue(lastPublishedRecord, ["rawAssets"]),
          validAssets: numberValue(lastPublishedRecord, ["validAssets"]),
          skippedAssets: numberValue(lastPublishedRecord, ["skippedAssets"]),
          publishedListings: numberValue(lastPublishedRecord, ["publishedListings"]),
          publishedFloats: numberValue(lastPublishedRecord, ["publishedFloats"]),
          publishedAt: nullableString(lastPublishedRecord, ["publishedAt"]),
          successfulAt: nullableString(lastPublishedRecord, ["successfulAt"]),
          completionReason:
            typeof lastPublishedRecord.completionReason === "string" &&
            COMPLETION_REASONS.has(
              lastPublishedRecord.completionReason as MarketSyncCompletionReason,
            )
              ? (lastPublishedRecord.completionReason as MarketSyncCompletionReason)
              : null,
        }
      : fallback?.lastPublished ?? null,
    snapshotHash:
      nullableString(record, ["snapshotHash"]) ?? fallback?.snapshotHash ?? null,
    snapshotFetchedAt:
      nullableString(record, ["snapshotFetchedAt", "lastDownloadedAt"]) ??
      fallback?.snapshotFetchedAt ??
      null,
    lastStartedAt:
      nullableString(record, ["lastStartedAt"]) ?? fallback?.lastStartedAt ?? null,
    lastFinishedAt:
      nullableString(record, ["lastFinishedAt", "lastPublishedAt"]) ??
      fallback?.lastFinishedAt ??
      null,
    lastSuccessfulAt:
      nullableString(record, ["lastSuccessfulAt", "lastPublishedAt"]) ??
      fallback?.lastSuccessfulAt ??
      null,
    lastError: nullableString(record, ["lastError", "error"]) ?? fallback?.lastError ?? null,
    completionReason,
    run,
    itemsCatalog: hasItemsCatalog
      ? {
          fetchedAt: nullableString(itemsCatalogRecord, ["fetchedAt"]),
          itemCount: numberValue(itemsCatalogRecord, ["itemCount"]),
          currentPage: numberValue(itemsCatalogRecord, ["currentPage", "pageCount"]),
          totalPages: numberValue(itemsCatalogRecord, ["totalPages", "pageCount"]),
          running:
            typeof itemsCatalogRecord.running === "boolean"
              ? itemsCatalogRecord.running
              : false,
        }
      : fallback?.itemsCatalog ?? null,
    rowsUsed,
    rateLimitResetsAt: nullableString(record, ["rateLimitResetsAt"]),
    listingsProcessed: numberValue(record, ["listingsProcessed"]),
    totalListings: numberValue(record, ["totalListings"]),
    floatsIndexed: numberValue(record, ["floatsIndexed"]),
    currentPage: numberValue(record, ["currentPage"]),
    maxPages: numberValue(record, ["maxPages"]),
  };
}

export function statusFromTriggerResponse(value: unknown): MarketSyncStatus | null {
  const record = asRecord(value);
  if (record.status !== null && typeof record.status === "object") {
    return normalizeMarketSyncStatus(record.status);
  }
  return null;
}

export function createAcceptedMarketSyncStatus(message: string): MarketSyncStatus {
  return normalizeMarketSyncStatus({
    running: true,
    phase: "building_priority_queue",
    message,
    targetAssets: DEFAULT_MARKET_SYNC_TARGET,
  });
}
