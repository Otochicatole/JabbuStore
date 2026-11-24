"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Bot,
  Calendar,
  Clock,
  Dices,
  Gift,
  Package,
  Pencil,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { AdminBadge, AdminButton, AdminSection } from "@/features/admin/ui/AdminShell";
import { ParticipationDrawAdminWinnersList } from "@/features/admin/participation-draws/ui/ParticipationDrawAdminWinnersList";

export interface AdminParticipationDrawPrize {
  id: string;
  position: number;
  name: string;
  iconUrl: string | null;
  winnerId?: string | null;
  winner?: {
    id: string;
    name: string | null;
    avatar: string | null;
    steamId?: string | null;
    tradeUrl?: string | null;
    isFake?: boolean;
  } | null;
  scheduledWinnerId?: string | null;
  scheduledWinner?: {
    id: string;
    name: string | null;
    avatar: string | null;
    steamId?: string | null;
    tradeUrl?: string | null;
    isFake?: boolean;
  } | null;
}

export interface AdminParticipationDrawWinner {
  prizeId: string;
  position: number;
  prizeName: string;
  prizeIconUrl: string | null;
  winner: {
    id: string;
    name: string | null;
    avatar: string | null;
    steamId?: string | null;
    tradeUrl?: string | null;
    isFake?: boolean;
  } | null;
}

export interface AdminParticipationDrawData {
  id: string;
  name: string;
  description: string | null;
  minRaffles: number;
  drawDate: string;
  status: string;
  eligibleCount: number;
  prizes: AdminParticipationDrawPrize[];
  winners?: AdminParticipationDrawWinner[];
}

interface AdminParticipationDrawCardProps {
  draw: AdminParticipationDrawData;
  actionLoading?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onShowEligible: (draw: AdminParticipationDrawData) => void;
  onRunDraw: (draw: AdminParticipationDrawData) => void;
  onManualDraw: (draw: AdminParticipationDrawData) => void;
  onAddBots: (draw: AdminParticipationDrawData) => void;
  onEdit: (draw: AdminParticipationDrawData) => void;
  onCancel: (draw: AdminParticipationDrawData) => void;
  onDelete: (draw: AdminParticipationDrawData) => void;
}

type DrawCardTab = "summary" | "prizes" | "scheduled" | "winners";

function statusTone(status: string): "accent" | "success" | "danger" | "neutral" {
  switch (status) {
    case "OPEN":
      return "accent";
    case "FINISHED":
      return "success";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export function AdminParticipationDrawCard({
  draw,
  actionLoading = false,
  t,
  onShowEligible,
  onRunDraw,
  onManualDraw,
  onAddBots,
  onEdit,
  onCancel,
  onDelete,
}: AdminParticipationDrawCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [activeTab, setActiveTab] = useState<DrawCardTab>("summary");
  const isOpen = draw.status === "OPEN";
  const isFinished = draw.status === "FINISHED";
  const leadPrize = draw.prizes[0];
  const scheduledPrizes = draw.prizes.filter((prize) => Boolean(prize.scheduledWinner));
  const winnersCount = draw.prizes.filter((prize) => Boolean(prize.winner)).length;

  const statusLabel =
    draw.status === "OPEN"
      ? t("participationDraws.status.open")
      : draw.status === "FINISHED"
        ? t("participationDraws.status.finished")
        : t("participationDraws.status.cancelled");

  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const now = Date.now();
      const drawTime = new Date(draw.drawDate).getTime();
      const diff = drawTime - now;

      if (diff <= 0) {
        setTimeLeft(t("raffles.drawingSoon"));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, "0");

      let formatted = "";
      if (days > 0) formatted += `${days}d `;
      formatted += `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      setTimeLeft(formatted);
    };

    const initTimeout = window.setTimeout(updateCountdown, 0);
    const interval = setInterval(updateCountdown, 1000);
    return () => {
      window.clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [isOpen, draw.drawDate, t]);

  const displayTimeLeft = isOpen ? timeLeft : "";
  const effectiveTab: DrawCardTab =
    (!isFinished && activeTab === "winners") || (!isOpen && activeTab === "scheduled")
      ? "summary"
      : activeTab;

  return (
    <AdminSection padded={false} className="overflow-hidden">
      <div className="space-y-4 p-4 sm:p-5">
        {/* Top Row: Lead Prize + Title + Countdown */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="relative flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0d0a18] p-1.5">
              {leadPrize?.iconUrl ? (
                <img
                  src={leadPrize.iconUrl}
                  alt={leadPrize.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Trophy className="h-6 w-6 text-white/25" />
              )}
              {draw.prizes.length > 1 && (
                <span className="absolute -right-1.5 -bottom-1.5 rounded border border-white/15 bg-[#1c1833] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  +{draw.prizes.length - 1}
                </span>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                  {draw.name}
                </h3>
                <AdminBadge tone={statusTone(draw.status)} dot={isOpen}>
                  {statusLabel}
                </AdminBadge>
                {isOpen && scheduledPrizes.length > 0 && (
                  <AdminBadge tone="warning">
                    {t("admin.participationDraws.scheduledWinners")} ({scheduledPrizes.length})
                  </AdminBadge>
                )}
              </div>
              <p className="line-clamp-2 max-w-3xl text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
                {draw.description || t("raffles.noDescription")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isOpen && (
              <div className="inline-flex h-8 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 text-xs">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono font-semibold text-white tabular-nums">
                  {displayTimeLeft || t("admin.raffles.calculating")}
                </span>
              </div>
            )}
            <AdminButton
              size="sm"
              variant="secondary"
              icon={Users}
              onClick={() => onShowEligible(draw)}
            >
              {t("admin.participationDraws.showEligible")}
            </AdminButton>
          </div>
        </div>

        {/* Unified Horizontal Metrics Strip */}
        <div className="grid grid-cols-2 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#1a1630] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              {t("admin.participationDraws.drawDate")}
            </div>
            <span className="mt-1 block truncate text-xs font-semibold text-white tabular-nums">
              {new Date(draw.drawDate).toLocaleString()}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Gift className="h-3.5 w-3.5 text-accent" />
              {t("admin.participationDraws.minRaffles")}
            </div>
            <span className="mt-1 block text-xs font-semibold text-white tabular-nums">
              {draw.minRaffles}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Package className="h-3.5 w-3.5 text-accent" />
              {t("admin.participationDraws.prizes")}
            </div>
            <span className="mt-1 block text-xs font-semibold text-white tabular-nums">
              {t("admin.raffles.prizesCount", { count: draw.prizes.length })}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              {t("admin.participationDraws.eligible")}
            </div>
            <span className="mt-1 block text-sm font-semibold text-emerald-400 tabular-nums">
              {draw.eligibleCount}
            </span>
          </div>
        </div>

        {/* Inline Tab Switcher */}
        <div className="space-y-3">
          <div
            role="tablist"
            className="inline-flex flex-wrap items-center gap-1 rounded-md border border-white/[0.07] bg-[#0e0b1a] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === "summary"}
              onClick={() => setActiveTab("summary")}
              className={`h-7 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                effectiveTab === "summary"
                  ? "bg-accent text-white font-semibold"
                  : "text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("admin.raffles.tabSummary")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === "prizes"}
              onClick={() => setActiveTab("prizes")}
              className={`inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                effectiveTab === "prizes"
                  ? "bg-accent text-white font-semibold"
                  : "text-[#9e98b6] hover:text-white"
              }`}
            >
              <span>{t("admin.participationDraws.prizes")}</span>
              <span className="rounded bg-white/[0.1] px-1.5 py-0.5 text-[11px] tabular-nums">
                {draw.prizes.length}
              </span>
            </button>
            {isOpen && scheduledPrizes.length > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={effectiveTab === "scheduled"}
                onClick={() => setActiveTab("scheduled")}
                className={`inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  effectiveTab === "scheduled"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-amber-300 hover:bg-amber-500/10"
                }`}
              >
                <span>{t("admin.participationDraws.scheduledWinners")}</span>
                <span className="rounded bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">
                  {scheduledPrizes.length}
                </span>
              </button>
            )}
            {isFinished && (
              <button
                type="button"
                role="tab"
                aria-selected={effectiveTab === "winners"}
                onClick={() => setActiveTab("winners")}
                className={`inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  effectiveTab === "winners"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-emerald-300 hover:bg-emerald-500/10"
                }`}
              >
                <Trophy className="h-3 w-3" />
                <span>{t("raffles.winners")}</span>
                <span className="rounded bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums">
                  {winnersCount}/{draw.prizes.length}
                </span>
              </button>
            )}
          </div>

          {effectiveTab === "summary" && (
            <div className="space-y-2.5">
              {draw.prizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {draw.prizes.slice(0, 6).map((prize) => (
                    <button
                      key={prize.id}
                      type="button"
                      onClick={() => setActiveTab("prizes")}
                      className="inline-flex max-w-[240px] items-center gap-2 rounded-md border border-white/[0.06] bg-[#1a1630] px-2.5 py-1.5 text-left transition-colors hover:border-white/15 cursor-pointer"
                    >
                      <span className="font-mono text-[11px] text-[#8e88a6] tabular-nums">
                        #{prize.position}
                      </span>
                      {prize.iconUrl ? (
                        <img
                          src={prize.iconUrl}
                          alt={prize.name}
                          className="h-6 w-7 shrink-0 object-contain"
                        />
                      ) : (
                        <Package className="h-4 w-4 shrink-0 text-[#746e8d]" />
                      )}
                      <span className="truncate text-xs font-medium text-white">{prize.name}</span>
                    </button>
                  ))}
                  {draw.prizes.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("prizes")}
                      className="inline-flex items-center rounded-md border border-white/[0.06] bg-[#1a1630] px-2.5 py-1.5 text-xs font-medium text-[#b8b2cd] hover:text-white cursor-pointer"
                    >
                      +{draw.prizes.length - 6} {t("admin.raffles.more")}
                    </button>
                  )}
                </div>
              )}

              {isOpen && scheduledPrizes.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs">
                  <span className="font-medium text-amber-200">
                    {t("admin.participationDraws.scheduledWinners")}:{" "}
                    {scheduledPrizes
                      .map(
                        (p) =>
                          `#${p.position} ${p.scheduledWinner?.name || t("participationDraws.anonymous")}`,
                      )
                      .join(" · ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scheduled")}
                    className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:underline cursor-pointer"
                  >
                    <span>{t("common.view")}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {isFinished && draw.prizes.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-medium text-emerald-200">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    {t("admin.raffles.prizesDelivered", {
                      delivered: winnersCount,
                      total: draw.prizes.length,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("winners")}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-300 hover:underline cursor-pointer"
                  >
                    <span>{t("raffles.winners")}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {effectiveTab === "prizes" && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {draw.prizes.map((prize) => (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-3"
                >
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] p-1">
                    {prize.iconUrl ? (
                      <img src={prize.iconUrl} alt={prize.name} className="h-full w-full object-contain" />
                    ) : (
                      <Package className="h-4 w-4 text-[#746e8d]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-[#9e98b6] tabular-nums">
                      #{prize.position}
                    </p>
                    <p className="truncate text-xs sm:text-[13px] font-semibold text-white">
                      {prize.name}
                    </p>
                    {prize.winner ? (
                      <p className="mt-0.5 truncate text-xs text-emerald-300">
                        {prize.winner.name || prize.winner.steamId}
                        {prize.winner.isFake ? " [BOT]" : ""}
                      </p>
                    ) : prize.scheduledWinner && isOpen ? (
                      <p className="mt-0.5 truncate text-xs text-amber-300">
                        {prize.scheduledWinner.name || t("participationDraws.anonymous")}
                        {prize.scheduledWinner.isFake ? " [BOT]" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {effectiveTab === "scheduled" && isOpen && scheduledPrizes.length > 0 && (
            <div className="space-y-2">
              {scheduledPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3"
                >
                  {prize.scheduledWinner?.avatar ? (
                    <img
                      src={prize.scheduledWinner.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-amber-200">
                      #{prize.position} · {prize.name}
                    </p>
                    <p className="truncate text-sm font-semibold text-white">
                      {prize.scheduledWinner?.name || t("participationDraws.anonymous")}
                      {prize.scheduledWinner?.isFake ? " [BOT]" : ""}
                    </p>
                  </div>
                  {prize.iconUrl && (
                    <img src={prize.iconUrl} alt="" className="h-8 w-8 object-contain" />
                  )}
                </div>
              ))}
            </div>
          )}

          {effectiveTab === "winners" && isFinished && (
            <ParticipationDrawAdminWinnersList prizes={draw.prizes} t={t} />
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-[#100d1e] px-4 py-3 sm:px-5">
        {isOpen && (
          <>
            <AdminButton
              size="sm"
              variant="primary"
              icon={Dices}
              onClick={() => onRunDraw(draw)}
              disabled={draw.eligibleCount < 1 || actionLoading}
            >
              {t("admin.participationDraws.runDraw")}
            </AdminButton>
            <AdminButton
              size="sm"
              variant="secondary"
              icon={Trophy}
              onClick={() => onManualDraw(draw)}
              disabled={draw.eligibleCount < 1 || actionLoading}
            >
              {t("admin.participationDraws.manualDraw")}
            </AdminButton>
            <AdminButton size="sm" variant="secondary" icon={Bot} onClick={() => onAddBots(draw)}>
              {t("admin.raffles.bots")}
            </AdminButton>
            <AdminButton size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(draw)}>
              {t("common.edit")}
            </AdminButton>
            <AdminButton size="sm" variant="danger" icon={Ban} onClick={() => onCancel(draw)}>
              {t("admin.participationDraws.cancel")}
            </AdminButton>
          </>
        )}

        {!isFinished && (
          <AdminButton size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(draw)}>
            {t("common.delete")}
          </AdminButton>
        )}
      </div>
    </AdminSection>
  );
}
