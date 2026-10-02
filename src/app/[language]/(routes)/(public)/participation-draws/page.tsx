"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2, Trophy, AlertCircle, Users, Gift, Package, Timer } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { BACKEND_URL } from "@/shared/lib/api";

interface DrawPrize {
  id: string;
  position: number;
  name: string;
  iconUrl: string | null;
  price: number;
  winner?: { id: string; name: string | null; avatar: string | null } | null;
}

interface ParticipationDrawListItem {
  id: string;
  name: string;
  description: string | null;
  minRaffles: number;
  drawDate: string;
  status: string;
  eligibleCount: number;
  prizes: DrawPrize[];
  winners: {
    prizeId: string;
    position: number;
    prizeName: string;
    prizeIconUrl: string | null;
    winner: { id: string; name: string | null; avatar: string | null } | null;
  }[];
  updatedAt: string;
}

function DrawCountdown({ drawDate }: { drawDate: string }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(drawDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft(t("participationDraws.drawStarting"));
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        const pad = (n: number) => n.toString().padStart(2, "0");
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [drawDate, t]);

  return <span>{timeLeft}</span>;
}

function ParticipationDrawsListContent() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [draws, setDraws] = useState<ParticipationDrawListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/participation-draws`, {
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (!response.ok) throw new Error(t("participationDraws.loadError"));
        const data = await response.json();
        setDraws(data);
      } catch (err: any) {
        setError(err.message || t("participationDraws.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, [t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-base font-black uppercase text-white tracking-wider mb-2">
          {t("participationDraws.loadErrorTitle")}
        </h3>
        <p className="text-xs text-[#84849b] max-w-sm mb-6">{error}</p>
      </div>
    );
  }

  if (draws.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <Trophy className="w-12 h-12 text-muted mb-4 opacity-50" />
        <p className="text-sm font-semibold text-[#84849b]">
          {t("participationDraws.empty")}
        </p>
      </div>
    );
  }

  const statusOrder: Record<string, number> = { OPEN: 0, FINISHED: 1 };
  const sorted = [...draws].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {sorted.map((draw) => {
        const isFinished = draw.status === "FINISHED";
        const primaryPrize = draw.prizes[0];

        return (
          <Link
            key={draw.id}
            href={localizePath(`/participation-draws/${draw.id}`)}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-card/40 border border-white/5 hover:border-accent/40 shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
              <div className="relative h-44 bg-gradient-to-b from-white/[0.02] to-card/10 flex items-center justify-center border-b border-white/5 p-6 select-none shrink-0 overflow-hidden">
                {primaryPrize?.iconUrl ? (
                  <img
                    src={primaryPrize.iconUrl}
                    alt={primaryPrize.name}
                    className="w-36 h-36 object-contain drop-shadow-[0_8px_24px_rgba(217,70,239,0.25)] transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <Package className="w-16 h-16 text-accent/40" />
                )}
                {draw.prizes.length > 1 && (
                  <div className="absolute right-4 bottom-4 bg-[#0e0c1b] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white px-2 py-1 rounded">
                    +{draw.prizes.length - 1} {t("raffles.prizes").toLowerCase()}
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  {isFinished ? (
                    <span className="bg-[#12b76a]/15 text-[#12b76a] border border-[#12b76a]/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {t("participationDraws.status.finished")}
                    </span>
                  ) : (
                    <span className="bg-accent/15 text-accent border border-accent/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
                      {t("participationDraws.status.open")}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight group-hover:text-accent transition-colors line-clamp-1">
                    {draw.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#84849b] line-clamp-2">
                    {primaryPrize?.name || t("participationDraws.prize")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-[#84849b]">
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-accent" />
                    {t("participationDraws.minRafflesLabel", {
                      count: draw.minRaffles,
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {t("participationDraws.eligibleCount", {
                      count: draw.eligibleCount,
                    })}
                  </span>
                </div>

                {!isFinished && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-300">
                    <Timer className="w-3.5 h-3.5 animate-pulse" />
                    <DrawCountdown drawDate={draw.drawDate} />
                  </div>
                )}

                {(draw.winners || []).slice(0, 1).map((w) => (
                  <div
                    key={w.prizeId}
                    className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
                  >
                    {w.winner?.avatar ? (
                      <img
                        src={w.winner.avatar}
                        alt=""
                        className="h-7 w-7 rounded-full border border-white/10"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-black">
                        ?
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                        {t("participationDraws.winner")}
                      </p>
                      <p className="truncate text-xs font-black text-white">
                        {w.winner?.name || t("participationDraws.anonymous")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ParticipationDrawsPage() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
      <div className="mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 mb-4">
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            {t("participationDraws.badge")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {t("participationDraws.title")}
        </h1>
        <p className="text-sm text-[#84849b] leading-relaxed">
          {t("participationDraws.description")}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        }
      >
        <ParticipationDrawsListContent />
      </Suspense>
    </div>
  );
}
