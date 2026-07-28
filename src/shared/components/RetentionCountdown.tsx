"use client";

import React, { useEffect, useState } from "react";

const RETENTION_DAYS = 8;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

interface RetentionCountdownProps {
  retentionStartedAt: string;
  /** Shows a compact one-liner version (for admin table rows) */
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

function calcTimeLeft(retentionStartedAt: string): TimeLeft {
  const startMs = new Date(retentionStartedAt).getTime();
  const endMs = startMs + RETENTION_MS;
  const diff = endMs - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

export function RetentionCountdown({ retentionStartedAt, compact = false }: RetentionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(retentionStartedAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(retentionStartedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [retentionStartedAt]);

  const progressPercent = timeLeft.expired
    ? 100
    : Math.min(100, ((RETENTION_MS - timeLeft.totalMs) / RETENTION_MS) * 100);

  if (timeLeft.expired) {
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: "8px",
        padding: compact ? "4px 10px" : "8px 14px",
        fontSize: compact ? "12px" : "13px",
        color: "#f87171",
        fontWeight: 600,
      }}>
        <span>⚠️</span>
        <span>Período vencido – pendiente de pago</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: "8px",
        padding: "4px 10px",
        fontSize: "12px",
        color: "#a5b4fc",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}>
        <span>⏱</span>
        <span>
          {String(timeLeft.days).padStart(2, "0")}d{" "}
          {String(timeLeft.hours).padStart(2, "0")}h{" "}
          {String(timeLeft.minutes).padStart(2, "0")}m{" "}
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>⏳</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#c4b5fd", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Período de Retención
        </span>
      </div>

      {/* Timer blocks */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {[
          { value: timeLeft.days, label: "días" },
          { value: timeLeft.hours, label: "horas" },
          { value: timeLeft.minutes, label: "min" },
          { value: timeLeft.seconds, label: "seg" },
        ].map(({ value, label }) => (
          <div key={label} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(0,0,0,0.35)",
            borderRadius: "10px",
            padding: "10px 14px",
            minWidth: "54px",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <span style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#e0e7ff",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}>
              {String(value).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "10px", color: "#7c7fad", marginTop: "4px", fontWeight: 600, textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        height: "6px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "3px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          borderRadius: "3px",
          transition: "width 1s linear",
        }} />
      </div>

      {/* Days passed label */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b6f99" }}>
        <span>Inicio de retención</span>
        <span>{Math.floor(progressPercent)}% completado</span>
        <span>Liberación en {timeLeft.days}d {timeLeft.hours}h</span>
      </div>
    </div>
  );
}
