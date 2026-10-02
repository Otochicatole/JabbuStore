"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Trophy,
  AlertCircle,
  ArrowLeft,
  Users,
  Gift,
  CheckCircle2,
  Lock,
  Package,
  Timer,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { SteamLoginButton } from "@/shared/components/SteamLoginButton";

interface DrawPrize {
  id: string;
  position: number;
  name: string;
  price: number;
  iconUrl: string | null;
  exterior: string | null;
  winner?: { id: string; name: string | null; avatar: string | null } | null;
}

interface ParticipationDrawDetail {
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

interface Eligibility {
  raffleCount: number;
  eligible: boolean;
  minRaffles: number;
}

function DetailCountdown({ drawDate }: { drawDate: string }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
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
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [drawDate, t]);

  return <span className="text-xs font-black text-cyan-300 font-mono">{timeLeft}</span>;
}

function ParticipationDrawDetailContent() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const params = useParams<{ id: string }>();
  const drawId = params?.id;

  const [draw, setDraw] = useState<ParticipationDrawDetail | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawId) return;

    const load = async () => {
      try {
        setError(null);
        const [drawRes, meRes] = await Promise.all([
          fetch(`${BACKEND_URL}/participation-draws/${drawId}`, {
            headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
          }),
          fetchWithAuth(`${BACKEND_URL}/users/me`).catch(() => null),
        ]);

        if (!drawRes.ok) {
          throw new Error(t("participationDraws.notFound"));
        }

        const drawData = await drawRes.json();
        setDraw(drawData);

        if (meRes && meRes.ok) {
          const me = await meRes.json();
          setIsLoggedIn(true);
          setCurrentUserId(me.id || null);
          const eligibilityRes = await fetchWithAuth(
            `${BACKEND_URL}/participation-draws/${drawId}/me`,
          );
          if (eligibilityRes.ok) {
            setEligibility(await eligibilityRes.json());
          }
        } else {
          setIsLoggedIn(false);
          setCurrentUserId(null);
        }
      } catch (err: any) {
        setError(err.message || t("participationDraws.loadError"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [drawId, t]);

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

  if (error || !draw) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-base font-black uppercase text-white tracking-wider mb-2">
          {t("participationDraws.loadErrorTitle")}
        </h3>
        <p className="text-xs text-[#84849b] max-w-sm mb-6">
          {error || t("participationDraws.notFound")}
        </p>
        <Link
          href={localizePath("/participation-draws")}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("participationDraws.back")}
        </Link>
      </div>
    );
  }

  const isFinished = draw.status === "FINISHED";
  const progress = eligibility
    ? Math.min(100, Math.round((eligibility.raffleCount / draw.minRaffles) * 100))
    : 0;
  const primaryPrize = draw.prizes[0];
  const userWonPrizes = (draw.winners || []).filter(
    (w) => currentUserId && w.winner?.id === currentUserId,
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
      <Link
        href={localizePath("/participation-draws")}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#84849b] hover:text-accent mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("participationDraws.back")}
      </Link>

      {userWonPrizes.length > 0 && (
        <div className="mb-6 rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
              {t("participationDraws.congratulations")}
            </p>
            <p className="text-sm font-bold text-white/90">
              {t("participationDraws.youWonBanner")}
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-card/40 overflow-hidden shadow-xl">
            <div className="relative h-64 sm:h-80 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center justify-center p-8">
              {primaryPrize?.iconUrl ? (
                <img
                  src={primaryPrize.iconUrl}
                  alt={primaryPrize.name}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_12px_40px_rgba(217,70,239,0.3)]"
                />
              ) : (
                <Package className="w-20 h-20 text-accent/40" />
              )}
              <div className="absolute top-4 left-4">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isFinished
                      ? "bg-[#12b76a]/15 text-[#12b76a] border-[#12b76a]/20"
                      : "bg-accent/15 text-accent border-accent/20"
                  }`}
                >
                  {isFinished
                    ? t("participationDraws.status.finished")
                    : t("participationDraws.status.open")}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {draw.name}
                </h1>
                {draw.description && (
                  <p className="mt-2 text-sm text-[#84849b] leading-relaxed">
                    {draw.description}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                  {t("participationDraws.prizes")}
                </p>
                <div className="space-y-2">
                  {draw.prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                    >
                      {prize.iconUrl ? (
                        <img
                          src={prize.iconUrl}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-white/20" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                          #{prize.position}
                        </p>
                        <p className="text-sm font-black text-white truncate">
                          {prize.name}
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#84849b]">
                        ${prize.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-2.5">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="text-xs font-black text-white">
                    {t("participationDraws.minRafflesLabel", {
                      count: draw.minRaffles,
                    })}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                  <Users className="w-4 h-4 text-[#84849b]" />
                  <span className="text-xs font-black text-white">
                    {t("participationDraws.eligibleCount", {
                      count: draw.eligibleCount,
                    })}
                  </span>
                </div>
                {!isFinished && (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5">
                    <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <DetailCountdown drawDate={draw.drawDate} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {(draw.winners || []).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-300" />
                {t("participationDraws.winners")}
              </h3>
              {draw.winners.map((w) => (
                <div
                  key={w.prizeId}
                  className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-center gap-4"
                >
                  {w.winner?.avatar ? (
                    <img
                      src={w.winner.avatar}
                      alt=""
                      className="h-12 w-12 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-black">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">
                      #{w.position} · {w.prizeName}
                    </p>
                    <p className="text-lg font-black text-white truncate">
                      {w.winner?.name || t("participationDraws.anonymous")}
                    </p>
                  </div>
                  {w.prizeIconUrl && (
                    <img
                      src={w.prizeIconUrl}
                      alt=""
                      className="h-12 w-12 object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-card/40 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              {t("participationDraws.yourProgress")}
            </h3>

            {!isLoggedIn ? (
              <div className="space-y-4">
                <p className="text-sm text-[#84849b] leading-relaxed">
                  {t("participationDraws.loginHint", {
                    count: draw.minRaffles,
                  })}
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <Lock className="w-5 h-5 text-[#84849b]" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-white mb-2">
                      {t("participationDraws.loginToCheck")}
                    </p>
                    <SteamLoginButton />
                  </div>
                </div>
              </div>
            ) : eligibility ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                      {t("participationDraws.rafflesPlayed")}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {eligibility.raffleCount}
                      <span className="text-sm text-[#84849b] font-bold">
                        {" "}
                        / {draw.minRaffles}
                      </span>
                    </p>
                  </div>
                  {eligibility.eligible ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {t("participationDraws.youAreEligible")}
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                      {t("participationDraws.notEligibleYet")}
                    </span>
                  )}
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      eligibility.eligible ? "bg-emerald-400" : "bg-accent"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-[#84849b] leading-relaxed">
                  {eligibility.eligible
                    ? t("participationDraws.eligibleMessage")
                    : t("participationDraws.needMoreRaffles", {
                        remaining: Math.max(
                          0,
                          draw.minRaffles - eligibility.raffleCount,
                        ),
                      })}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#84849b]">{t("common.loading")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParticipationDrawDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      }
    >
      <ParticipationDrawDetailContent />
    </Suspense>
  );
}
