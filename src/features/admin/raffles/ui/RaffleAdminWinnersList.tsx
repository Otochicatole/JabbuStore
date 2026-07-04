"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Gift, Trophy, User as UserIcon } from "lucide-react";

import {
  countPrizeWinners,
  getPrizeWinner,
  hasPrizeWinner,
  type RafflePrizeWithWinner,
} from "@/features/raffles/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface RaffleAdminWinnersListProps {
  prizes: RafflePrizeWithWinner[];
  t: Translate;
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
      <span className="font-mono text-[8.5px] text-white/80 block break-all select-all leading-normal">
        {tradeUrl}
      </span>
      <div className="flex gap-2">
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-8 flex items-center justify-center gap-1.5 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-[3px]"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {t("admin.orders.openTrade")}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className={`h-8 px-3 flex items-center justify-center gap-1.5 border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-[3px] ${
            copied
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/5 text-[#84849b] hover:text-white hover:bg-white/10 hover:border-white/10"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t("admin.orders.copied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{t("admin.orders.copy")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function RaffleAdminWinnersList({ prizes, t }: RaffleAdminWinnersListProps) {
  const winnersCount = countPrizeWinners(prizes);

  return (
    <div className="rounded-[3px] border border-emerald-500/15 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white">
            {t("raffles.winners")}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
          {t("admin.raffles.prizesDelivered", { delivered: winnersCount, total: prizes.length })}
        </span>
      </div>

      <div className="space-y-2">
        {prizes.map((prize) => {
          const winner = getPrizeWinner(prize);
          const won = hasPrizeWinner(prize);

          return (
            <div
              key={prize.id}
              className="flex items-start gap-3 rounded-[3px] border border-white/5 bg-[#0b0818]/60 p-3"
            >
              <div className="w-10 h-10 rounded-[3px] border border-white/5 bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                {prize.iconUrl ? (
                  <img src={prize.iconUrl} alt={prize.name} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Gift className="w-4 h-4 text-white/20" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-white truncate uppercase">{prize.name}</p>
                {won && winner ? (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-500/30 shrink-0">
                        {winner.avatar ? (
                          <img src={winner.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <UserIcon className="w-3 h-3 text-[#84849b]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-[9px] font-bold text-emerald-400 truncate">
                            {winner.name || winner.steamId || "Steam User"}
                          </p>
                          {(winner as any).isFake && (
                            <span className="px-1 py-0.5 text-[8px] bg-red-500/20 text-red-400 font-black uppercase rounded tracking-wider border border-red-500/30 shrink-0 leading-none">
                              [BOT]
                            </span>
                          )}
                        </div>
                        {prize.winningTicket && (
                          <p className="text-[8px] font-mono text-[#84849b]">
                            {t("raffles.ticketNumber", { number: prize.winningTicket.ticketNumber })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-wider text-[#84849b] mb-1">
                        {t("profile.tradeUrl")}
                      </p>
                      {winner.tradeUrl ? (
                        <WinnerTradeUrlActions tradeUrl={winner.tradeUrl} t={t} />
                      ) : (
                        <p className="text-[8px] font-bold text-amber-400/80">
                          {t("admin.common.noTradeUrl")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] font-bold text-[#84849b] mt-1">{t("raffles.noWinnerAssigned")}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
