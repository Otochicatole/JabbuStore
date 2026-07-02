"use client";

import { Crown, Gift, Sparkles, Trophy, User as UserIcon } from "lucide-react";

import {
  countPrizeWinners,
  getPrizeWinner,
  hasPrizeWinner,
  type RafflePrizeWithWinner,
} from "@/features/raffles/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface RaffleWinnersSectionProps {
  prizes: RafflePrizeWithWinner[];
  currentUserId?: string | null;
  drawDate?: string;
  variant: "hero" | "compact" | "sidebar";
  t: Translate;
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
        <img src={winner.avatar} alt={winner.name || ""} className="w-full h-full object-cover" />
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

    const winnerPrizes = prizes.filter(hasPrizeWinner).slice(0, 3);

    return (
      <div className="px-5 pb-3 flex flex-col items-center gap-2">
        <div className="flex items-center -space-x-2">
          {winnerPrizes.map((prize) => {
            const winner = getPrizeWinner(prize);
            if (!winner) return null;
            return (
              <div key={prize.id} className="ring-2 ring-[#0e0c1b] rounded-full">
                <WinnerAvatar winner={winner} size="sm" />
              </div>
            );
          })}
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
                    <p className="text-[10px] font-black text-white truncate uppercase">{prize.name}</p>
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
    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#110f1e] to-accent/5 p-6 sm:p-8 shadow-2xl">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              {t("raffles.winners")}
            </h2>
            {drawDate && (
              <p className="text-[10px] font-mono text-[#84849b] uppercase tracking-wider mt-0.5">
                {t("raffles.drawDate")}: {new Date(drawDate).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
          <Trophy className="w-3.5 h-3.5" />
          {t("raffles.winnersCount", { count: winnersCount })}
        </span>
      </div>

      {userWonPrizes.length > 0 && (
        <div className="relative mb-6 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 to-accent/10 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-amber-300">
                {t("raffles.congratulations")}
              </p>
              <p className="text-xs font-bold text-white/90 mt-1">{t("raffles.youWonBanner")}</p>
              <ul className="mt-2 space-y-1">
                {userWonPrizes.map((prize) => (
                  <li key={prize.id} className="text-[10px] font-bold text-emerald-300">
                    {t("raffles.prizeWon", { prize: prize.name })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-4">
        {prizes.map((prize) => {
          const winner = getPrizeWinner(prize);
          const won = hasPrizeWinner(prize);
          const isCurrentUserWinner = Boolean(
            currentUserId && winner && winner.id === currentUserId
          );

          return (
            <div
              key={prize.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-5 transition-all ${
                won
                  ? isCurrentUserWinner
                    ? "border-amber-400/40 bg-amber-500/5 shadow-[0_0_30px_rgba(251,191,36,0.08)]"
                    : "border-emerald-500/25 bg-emerald-500/5"
                  : "border-white/5 bg-white/[0.02] opacity-60"
              }`}
            >
              <PrizeThumb prize={prize} className="w-24 h-24 sm:w-28 sm:h-28" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white uppercase tracking-wide truncate">
                  {prize.name}
                </p>
                <p className="text-sm font-black text-emerald-400 mt-1">${prize.price.toFixed(2)}</p>

                {won && winner ? (
                  <div className="mt-4 flex items-center gap-3">
                    <WinnerAvatar winner={winner} size="lg" />
                    <div className="min-w-0">
                      <span className="block text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                        {t("raffles.wonBy")}
                      </span>
                      <span className="block text-sm font-black text-white truncate">
                        {winner.name || "Steam User"}
                      </span>
                      {prize.winningTicket && (
                        <span className="block text-[10px] font-mono text-[#84849b] mt-0.5">
                          {t("raffles.ticketNumber", { number: prize.winningTicket.ticketNumber })}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                    {t("raffles.noWinnerAssigned")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
