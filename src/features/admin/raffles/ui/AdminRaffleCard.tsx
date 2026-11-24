import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gift,
  ExternalLink,
  Calendar,
  Ticket,
  Package,
  Clock,
  ShieldAlert,
  Activity,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { AdminBadge, AdminSection } from "@/features/admin/ui/AdminShell";
import { RaffleManageActions, type RaffleManageData } from "@/features/admin/raffles/ui/RaffleManageActions";
import { RaffleAdminWinnersList } from "@/features/admin/raffles/ui/RaffleAdminWinnersList";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

interface RafflePrizeItem {
  id: string;
  name: string;
  iconUrl: string | null;
  position?: number;
  winnerId?: string | null;
  winner?: { id: string; name: string | null; steamId: string | null; avatar: string | null; tradeUrl?: string | null } | null;
  winningTicket?: { ticketNumber: number } | null;
}

interface AdminRaffleData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isPublic?: boolean;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  prizes?: RafflePrizeItem[];
  tickets?: { status: string }[];
}

interface AdminRaffleCardProps {
  raffle: AdminRaffleData;
  fetchRaffles: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

type RaffleCardTab = "summary" | "prizes" | "winners";

const getRaffleStatusTone = (status: string): "neutral" | "accent" | "success" | "danger" => {
  switch (status) {
    case "ACTIVE":
      return "accent";
    case "FINISHED":
      return "success";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
};

export const AdminRaffleCard: React.FC<AdminRaffleCardProps> = ({ raffle, fetchRaffles, t }) => {
  const localizePath = useLocalizedPath();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [activeTab, setActiveTab] = useState<RaffleCardTab>("summary");
  const isFinished = raffle.status === "FINISHED";
  const isActive = raffle.status === "ACTIVE";
  const prizes = raffle.prizes ?? [];
  const leadPrize = prizes[0];
  const soldTickets = raffle.tickets?.filter((ticket) => ticket.status === "PAID").length || 0;
  const winnersCount = prizes.filter((p) => Boolean(p.winner || p.winnerId)).length;

  const pct = raffle.maxTickets
    ? Math.min(100, Math.round((soldTickets / raffle.maxTickets) * 100))
    : 0;

  const manageData: RaffleManageData = {
    id: raffle.id,
    name: raffle.name,
    description: raffle.description,
    status: raffle.status,
    isPublic: raffle.isPublic,
    drawDate: raffle.drawDate,
    ticketPrice: raffle.ticketPrice,
    maxTickets: raffle.maxTickets,
    soldChances: soldTickets,
  };

  useEffect(() => {
    if (!isActive) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const drawTime = new Date(raffle.drawDate).getTime();
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
  }, [isActive, raffle.drawDate, t]);

  const displayTimeLeft = isActive ? timeLeft : "";
  const effectiveTab: RaffleCardTab = !isFinished && activeTab === "winners" ? "summary" : activeTab;

  return (
    <AdminSection padded={false} className="overflow-hidden">
      <div className="space-y-4 p-4 sm:p-5">
        {/* Top Row: Lead Skin + Identity + Countdown */}
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
                <Gift className="h-6 w-6 text-white/25" />
              )}
              {prizes.length > 1 && (
                <span className="absolute -right-1.5 -bottom-1.5 rounded border border-white/15 bg-[#1c1833] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  +{prizes.length - 1}
                </span>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                  {raffle.name}
                </h3>
                <AdminBadge tone={getRaffleStatusTone(raffle.status)} dot={isActive}>
                  {t(
                    `admin.status${raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1).toLowerCase()}`,
                  ) || raffle.status}
                </AdminBadge>
                {raffle.isPublic === false && (
                  <AdminBadge tone="warning">
                    <ShieldAlert className="h-3 w-3" />
                    {t("admin.raffles.hiddenFromClient")}
                  </AdminBadge>
                )}
              </div>
              <p className="line-clamp-2 max-w-3xl text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
                {raffle.description || t("raffles.noDescription")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isActive && (
              <div className="inline-flex h-8 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 text-xs">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono font-semibold text-white tabular-nums">
                  {displayTimeLeft || t("admin.raffles.calculating")}
                </span>
              </div>
            )}
            <Link
              href={localizePath(`/admin/panel/raffle-purchases?raffle=${raffle.id}`)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-[#1c1833] px-3 text-xs font-semibold text-white hover:bg-[#252042] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#9e98b6]" />
              {t("raffles.viewParticipants")}
            </Link>
          </div>
        </div>

        {/* Unified Horizontal Metrics Strip */}
        <div className="grid grid-cols-2 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#1a1630] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              {t("admin.raffles.drawDateLabel")}
            </div>
            <span className="mt-1 block truncate text-xs font-semibold text-white tabular-nums">
              {new Date(raffle.drawDate).toLocaleString()}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Ticket className="h-3.5 w-3.5 text-accent" />
              {t("common.price")}
            </div>
            <span className="mt-1 block text-xs font-semibold text-white tabular-nums">
              ${raffle.ticketPrice.toFixed(2)} {t("admin.raffles.perChance")}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Gift className="h-3.5 w-3.5 text-accent" />
              {t("raffles.prizes")}
            </div>
            <span className="mt-1 block text-xs font-semibold text-white tabular-nums">
              {t("admin.raffles.prizesCount", { count: prizes.length })}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-[#8e88a6]">
              <span>{t("admin.raffles.ticketProgress")}</span>
              {raffle.maxTickets && (
                <span className="font-semibold text-accent tabular-nums">{pct}%</span>
              )}
            </div>
            <span className="mt-1 block text-xs font-semibold text-white tabular-nums">
              {soldTickets} {raffle.maxTickets ? `/ ${raffle.maxTickets}` : ""}
            </span>
            {raffle.maxTickets ? (
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : (
              <span className="mt-0.5 block text-[11px] text-[#8e88a6]">
                {t("admin.raffles.unlimitedTickets")}
              </span>
            )}
          </div>

          <div className="col-span-2 p-3 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              {t("admin.raffles.revenue")}
            </div>
            <span className="mt-1 block text-sm font-semibold text-emerald-400 tabular-nums">
              ${(soldTickets * raffle.ticketPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Inline Tab Switcher */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-[#0e0b1a] p-1"
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
                <span>{t("raffles.prizes")}</span>
                <span className="rounded bg-white/[0.1] px-1.5 py-0.5 text-[11px] tabular-nums">
                  {prizes.length}
                </span>
              </button>
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
                    {winnersCount}/{prizes.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {effectiveTab === "summary" && (
            <div className="space-y-2.5">
              {prizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prizes.slice(0, 6).map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveTab("prizes")}
                      className="inline-flex max-w-[240px] items-center gap-2 rounded-md border border-white/[0.06] bg-[#1a1630] px-2.5 py-1.5 text-left transition-colors hover:border-white/15 cursor-pointer"
                    >
                      <span className="text-[11px] font-mono text-[#8e88a6] tabular-nums">
                        #{p.position ?? idx + 1}
                      </span>
                      {p.iconUrl ? (
                        <img
                          src={p.iconUrl}
                          alt={p.name}
                          className="h-6 w-7 shrink-0 object-contain"
                        />
                      ) : (
                        <Package className="h-4 w-4 shrink-0 text-[#746e8d]" />
                      )}
                      <span className="truncate text-xs font-medium text-white">{p.name}</span>
                    </button>
                  ))}
                  {prizes.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("prizes")}
                      className="inline-flex items-center rounded-md border border-white/[0.06] bg-[#1a1630] px-2.5 py-1.5 text-xs font-medium text-[#b8b2cd] hover:text-white cursor-pointer"
                    >
                      +{prizes.length - 6} {t("admin.raffles.more")}
                    </button>
                  )}
                </div>
              )}

              {isFinished && prizes.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-medium text-emerald-200">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    {t("admin.raffles.prizesDelivered", {
                      delivered: winnersCount,
                      total: prizes.length,
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
              {prizes.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-3"
                >
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] p-1">
                    {p.iconUrl ? (
                      <img src={p.iconUrl} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <Package className="h-4 w-4 text-[#746e8d]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-[#9e98b6] tabular-nums">
                      #{p.position ?? idx + 1}
                    </p>
                    <p className="truncate text-xs sm:text-[13px] font-semibold text-white">
                      {p.name}
                    </p>
                    {p.winner && (
                      <p className="mt-0.5 truncate text-xs text-emerald-300">
                        {p.winner.name || p.winner.steamId}
                        {p.winningTicket ? ` · #${p.winningTicket.ticketNumber}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {effectiveTab === "winners" && isFinished && raffle.prizes && (
            <RaffleAdminWinnersList prizes={raffle.prizes as never} t={t} />
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-[#100d1e] px-4 py-3 sm:px-5">
        <RaffleManageActions
          raffle={manageData}
          onUpdated={fetchRaffles}
          onDeleted={fetchRaffles}
          layout="toolbar"
        />
      </div>
    </AdminSection>
  );
};
