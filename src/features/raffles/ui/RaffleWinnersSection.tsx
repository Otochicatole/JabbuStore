"use client";

import { Crown, Gift, Sparkles, Trophy, User as UserIcon } from "lucide-react";

import {
  countPrizeWinners,
  getPrizeWinner,
  hasPrizeWinner,
  getUniqueWinners,
  type RafflePrizeWithWinner,
} from "@/features/raffles/types";
import { Money } from "@/features/currency/ui/Money";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface RaffleWinnersSectionProps {
  prizes: RafflePrizeWithWinner[];
  currentUserId?: string | null;
  drawDate?: string;
  variant: "hero" | "compact" | "sidebar";
  t: Translate;
}

function formatItemName(name: string) {
  return name
    .replace(/\(Factory New\)/i, "(FN)")
    .replace(/\(Minimal Wear\)/i, "(MW)")
    .replace(/\(Field-Tested\)/i, "(FT)")
    .replace(/\(Well-Worn\)/i, "(WW)")
    .replace(/\(Battle-Scarred\)/i, "(BS)");
}

function WinnerAvatar({
  winner,
  size = "md",
}: {
  winner: { name: string | null; avatar: string | null };
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "w-14 h-14" : size === "sm" ? "w-7 h-7" : "w-10 h-10";
  const iconSize = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border-2 border-emerald-400/50 bg-emerald-500/10 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.25)]`}
    >
      {winner.avatar ? (
        <img
          src={winner.avatar}
          alt={winner.name || ""}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-emerald-400/70">
          <UserIcon className={iconSize} />
        </div>
      )}
    </div>
  );
}

function PrizeThumb({ prize, className = "w-20 h-20" }: { prize: RafflePrizeWithWinner; className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0`}
    >
      {prize.iconUrl ? (
        <img src={prize.iconUrl} alt={prize.name} className="w-full h-full object-contain drop-shadow-lg" />
      ) : (
        <Gift className="w-8 h-8 text-accent/40" />
      )}
    </div>
  );
}

export function RaffleWinnersSection({
  prizes,
  currentUserId,
  drawDate,
  variant,
  t,
}: RaffleWinnersSectionProps) {
  const winnersCount = countPrizeWinners(prizes);
  const userWonPrizes = prizes.filter(
    (prize) => hasPrizeWinner(prize) && getPrizeWinner(prize)?.id === currentUserId
  );

  if (variant === "compact") {
    if (winnersCount === 0) return null;

    const uniqueWinners = getUniqueWinners(prizes).slice(0, 3);

    return (
      <div className="px-5 pb-3 flex flex-col items-center gap-2">
        <div className="flex items-center -space-x-2">
          {uniqueWinners.map((winner) => (
            <div key={winner.id} className="ring-2 ring-[#0e0c1b] rounded-full">
              <WinnerAvatar winner={winner} size="sm" />
            </div>
          ))}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
          {t("raffles.winnersCount", { count: winnersCount })}
        </span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <section className="bg-emerald-500/5 border border-emerald-500/15 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            {t("raffles.winners")}
          </h3>
        </div>

        {userWonPrizes.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-300 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {t("raffles.congratulations")}
              </span>
            </div>
            <p className="text-xs font-bold text-white/90">{t("raffles.youWonBanner")}</p>
          </div>
        )}

        {winnersCount === 0 ? (
          <p className="text-xs text-[#84849b] font-bold">{t("raffles.noWinnerAssigned")}</p>
        ) : (
          <div className="space-y-3">
            {prizes.map((prize) => {
              const winner = getPrizeWinner(prize);
              const won = hasPrizeWinner(prize);

              return (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <PrizeThumb prize={prize} className="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-white truncate uppercase">{formatItemName(prize.name)}</p>
                    {won && winner ? (
                      <div className="flex items-center gap-2 mt-1">
                        <WinnerAvatar winner={winner} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-emerald-400 truncate">
                            {winner.name || "Steam User"}
                          </p>
                          {prize.winningTicket && (
                            <p className="text-[8px] font-mono text-[#84849b]">
                              {t("raffles.ticketNumber", { number: prize.winningTicket.ticketNumber })}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[9px] text-[#84849b] font-bold mt-1">
                        {t("raffles.noWinnerAssigned")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {drawDate && (
          <p className="mt-4 text-[9px] font-mono text-[#84849b] uppercase tracking-wider">
            {t("raffles.drawDate")}: {new Date(drawDate).toLocaleString()}
          </p>
        )}
      </section>
    );
  }

  // hero variant
  return (
    <section className="bg-card border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
        <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
          {t("raffles.winners")}
        </h2>
        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
          {winnersCount} {t("raffles.winnersCount", { count: winnersCount }).replace(/[0-9]/g, '').trim()}
        </span>
      </div>

      {userWonPrizes.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-0.5">
              {t("raffles.congratulations")}
            </p>
            <p className="text-[10px] font-bold text-white/80">
              {t("raffles.youWonBanner")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {prizes.map((prize) => {
          const winner = getPrizeWinner(prize);
          const won = hasPrizeWinner(prize);
          const isCurrentUserWinner = Boolean(currentUserId && winner && winner.id === currentUserId);

          return (
            <div
              key={prize.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${
                won
                  ? isCurrentUserWinner
                    ? "border-amber-400/40 bg-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.05)]"
                    : "border-white/5 bg-[#0e0c1b]/50"
                  : "border-white/5 bg-white/[0.02] opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <PrizeThumb prize={prize} className="w-16 h-16 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent text-[10px] font-black uppercase tracking-wider">#{prize.position || 1}</span>
                    <p className="text-[10px] font-black text-white/90 uppercase tracking-wider truncate">
                      {formatItemName(prize.name)}
                    </p>
                  </div>
                  <Money amountUsd={prize.price} className="text-xs font-black text-emerald-400 mt-1" />
                </div>
              </div>

              {won && winner ? (
                <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <WinnerAvatar winner={winner} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-0.5">{t("raffles.wonBy")}</p>
                      <p className="text-[10px] font-bold text-white truncate">{winner.name || "Steam User"}</p>
                    </div>
                  </div>
                  {prize.winningTicket && (
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-0.5">Ticket</p>
                      <p className="text-[10px] font-mono text-white/80">#{prize.winningTicket.ticketNumber}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1 pt-3 border-t border-white/5 flex items-center justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                    {t("raffles.noWinnerAssigned")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
