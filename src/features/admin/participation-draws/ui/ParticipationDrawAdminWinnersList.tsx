"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Gift, Trophy, User as UserIcon } from "lucide-react";
import { AdminBadge } from "@/features/admin/ui/AdminShell";

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface ParticipationDrawPrizeWithWinner {
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
}

function WinnerTradeUrlActions({ tradeUrl, t }: { tradeUrl: string; t: Translate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tradeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <span className="block break-all select-all font-mono text-xs leading-normal text-[#c2bdd6]">
        {tradeUrl}
      </span>
      <div className="flex flex-wrap gap-2">
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-[#1c1833] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#252042]"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" />
          {t("admin.orders.openTrade")}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
            copied
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 bg-[#1c1833] text-[#b8b2cd] hover:bg-[#252042] hover:text-white"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t("admin.orders.copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{t("admin.orders.copy")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ParticipationDrawAdminWinnersList({
  prizes,
  t,
}: {
  prizes: ParticipationDrawPrizeWithWinner[];
  t: Translate;
}) {
  const winnersCount = prizes.filter((prize) => Boolean(prize.winner)).length;

  return (
    <div className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">
            {t("raffles.winners")}
          </span>
        </div>
        <AdminBadge tone="success">
          {t("admin.raffles.prizesDelivered", {
            delivered: winnersCount,
            total: prizes.length,
          })}
        </AdminBadge>
      </div>

      <div className="space-y-2">
        {prizes.map((prize) => {
          const winner = prize.winner;
          const won = Boolean(winner);

          return (
            <div
              key={prize.id}
              className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-[#141124] p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#0d0a18]">
                {prize.iconUrl ? (
                  <img
                    src={prize.iconUrl}
                    alt={prize.name}
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <Gift className="h-4 w-4 text-white/25" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  #{prize.position} · {prize.name}
                </p>
                {won && winner ? (
                  <div className="mt-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-emerald-500/30">
                        {winner.avatar ? (
                          <img src={winner.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <UserIcon className="h-3 w-3 text-[#9e98b6]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-emerald-300">
                            {winner.name || winner.steamId || t("participationDraws.anonymous")}
                          </p>
                          {winner.isFake && <AdminBadge tone="danger">BOT</AdminBadge>}
                        </div>
                        {winner.steamId && !winner.isFake && (
                          <p className="truncate font-mono text-xs text-[#9e98b6]">
                            {winner.steamId}
                          </p>
                        )}
                      </div>
                    </div>

                    {!winner.isFake && (
                      <div className="mt-2.5 border-t border-white/[0.06] pt-2">
                        <p className="mb-1 text-xs font-medium text-[#9e98b6]">
                          {t("profile.tradeUrl")}
                        </p>
                        {winner.tradeUrl ? (
                          <WinnerTradeUrlActions tradeUrl={winner.tradeUrl} t={t} />
                        ) : (
                          <p className="text-xs font-medium text-amber-300">
                            {t("admin.common.noTradeUrl")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[#9e98b6]">
                    {t("raffles.noWinnerAssigned")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
