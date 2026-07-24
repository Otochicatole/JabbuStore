import type {
  MarketSyncCompletionReason,
  MarketSyncPhase,
  MarketSyncStatus,
  PriceCatalogStatus,
} from "@/features/admin/types";

export const DEFAULT_MARKET_SYNC_TARGET = 10_000;

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
  "failed",
  "fetching_youpin",
  "downloading_assets",
  "saving_database",
]);

const COMPLETION_REASONS = new Set<MarketSyncCompletionReason>([
  "target_reached",
  "catalog_exhausted",
]);

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
    assetsPerItem: numberValue(record, ["assetsPerItem"], fallback?.assetsPerItem || 7),
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
