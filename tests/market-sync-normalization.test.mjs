import { describe, expect, it } from "bun:test";
import {
  MARKET_SYNC_PHASE_LABEL_KEYS,
  MARKET_SYNC_WARNING_KEYS,
  marketSyncBasePollingDelay,
  marketSyncPollingDelay,
  normalizeMarketSyncStatus,
  shouldPollMarketSyncStatus,
} from "../src/features/admin/settings/ui/AdminSettings/marketSync.ts";
import { br } from "../src/shared/i18n/dictionaries/br.ts";
import { en } from "../src/shared/i18n/dictionaries/en.ts";
import { es } from "../src/shared/i18n/dictionaries/es.ts";

function statusWithRun(run) {
  return normalizeMarketSyncStatus({
    running: run?.status === "running",
    resumable: run?.status === "paused",
    phase:
      run?.status === "completed"
        ? "completed"
        : run?.status === "failed"
          ? "failed"
          : run?.status === "paused"
            ? "paused"
            : "collecting_assets",
    run,
  });
}

describe("normalizeMarketSyncStatus", () => {
  it("mantiene compatibilidad con un status legacy sin run", () => {
    const status = normalizeMarketSyncStatus({
      running: true,
      phase: "collecting_assets",
      validAssets: 25,
      targetAssets: 100,
    });

    expect(status.run).toBeNull();
    expect(status.validAssets).toBe(25);
    expect(status.targetAssets).toBe(100);
  });

  it("normaliza telemetría durable y descarta valores inválidos", () => {
    const status = statusWithRun({
      id: "run-1",
      status: "running",
      resumed: true,
      attemptCount: 2,
      runStartedAt: "2026-07-21T00:00:00.000Z",
      attemptStartedAt: "2026-07-21T00:01:00.000Z",
      lastHeartbeatAt: "2026-07-21T00:02:00.000Z",
      elapsed: { wallMs: 120_000, activeMs: 90_000, pausedMs: 10_000 },
      phases: [
        { phase: "collecting_assets", durationMs: 90_000, entryCount: 2, current: true },
        { phase: "unknown", durationMs: 1, entryCount: 1, current: false },
      ],
      requests: {
        attempts: 20,
        succeeded: 15,
        retries: 3,
        timeouts: 2,
        emptyResponses: 5,
        latencyMs: { samples: 15, average: 850, p95Approx: 1_400 },
      },
      quota: { runUnitsUsed: 200, creditsUsed: 12.5, windowUnitsUsed: 80, limit: 10_000 },
      concurrency: { configured: 12, current: 6, reductions: 1 },
      throughput: {
        validAssetsPerMinute: 320,
        etaSeconds: 90,
        etaConfidence: "medium",
      },
      slowReason: "adaptive_concurrency",
      recommendedPollAfterMs: 5_000,
      deferredCandidateCount: 4,
      warnings: ["timeout diferido", 42],
    });

    expect(status.run).toMatchObject({
      id: "run-1",
      resumed: true,
      attemptCount: 2,
      deferredCandidateCount: 4,
      slowReason: "adaptive_concurrency",
      recommendedPollAfterMs: 5_000,
      warnings: ["timeout diferido"],
      requests: { attempts: 20, emptyResponses: 5, timeouts: 2, retries: 3 },
      throughput: { validAssetsPerMinute: 320, etaSeconds: 90, etaConfidence: "medium" },
    });
    expect(status.run.phases).toHaveLength(1);
    expect(status.run.elapsed.quotaWaitMs).toBe(0);
    expect(status.run.quota.creditsUsed).toBe(12.5);
  });

  it("un run null explícito limpia la telemetría anterior", () => {
    const previous = statusWithRun({ id: "run-1", status: "running" });
    const next = normalizeMarketSyncStatus({ run: null }, previous);
    expect(next.run).toBeNull();
  });
});

describe("market sync polling", () => {
  it("usa 5s recolectando y 2s publicando", () => {
    expect(marketSyncBasePollingDelay("collecting_assets")).toBe(5_000);
    expect(marketSyncBasePollingDelay("publishing_database")).toBe(2_000);
  });

  it("respeta la recomendación dentro de límites seguros", () => {
    expect(marketSyncPollingDelay({ recommendedPollAfterMs: 500 })).toBe(1_000);
    expect(marketSyncPollingDelay({ recommendedPollAfterMs: 60_000 })).toBe(30_000);
  });

  it("espacia la espera de cuota hasta un máximo de 30s", () => {
    expect(
      marketSyncPollingDelay(
        { phase: "waiting_rate_limit", quotaResetsAt: "1970-01-01T00:01:00.000Z" },
        0,
      ),
    ).toBe(30_000);
    expect(
      marketSyncPollingDelay(
        { phase: "waiting_rate_limit", quotaResetsAt: "1970-01-01T00:00:04.000Z" },
        0,
      ),
    ).toBe(5_000);
  });

  it("detiene estados terminales y pausados, pero conserva running", () => {
    expect(shouldPollMarketSyncStatus(statusWithRun({ id: "done", status: "completed" }))).toBe(false);
    expect(shouldPollMarketSyncStatus(statusWithRun({ id: "failed", status: "failed" }))).toBe(false);
    expect(shouldPollMarketSyncStatus(statusWithRun({ id: "paused", status: "paused" }))).toBe(false);
    expect(shouldPollMarketSyncStatus(statusWithRun({ id: "running", status: "running" }))).toBe(true);
  });

  it("sólo mantiene polling durante una espera de cuota actual", () => {
    const waiting = normalizeMarketSyncStatus({
      running: true,
      resumable: true,
      phase: "waiting_rate_limit",
      run: { id: "quota", status: "paused", slowReason: "quota_wait" },
    });
    const historicalQuotaWait = normalizeMarketSyncStatus({
      running: false,
      phase: "completed",
      run: { id: "done", status: "completed", slowReason: "quota_wait" },
    });

    expect(shouldPollMarketSyncStatus(waiting)).toBe(true);
    expect(shouldPollMarketSyncStatus(historicalQuotaWait)).toBe(false);
  });
});

describe("market sync translations", () => {
  it("incluye fases y warnings conocidos en los tres idiomas", () => {
    const keys = [
      ...new Set(Object.values(MARKET_SYNC_PHASE_LABEL_KEYS)),
      ...new Set(Object.values(MARKET_SYNC_WARNING_KEYS)),
      "admin.settings.syncWarningsTitle",
    ];

    for (const key of keys) {
      expect(es[key]).toBeTruthy();
      expect(en[key]).toBeTruthy();
      expect(br[key]).toBeTruthy();
    }
  });
});
