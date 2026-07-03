"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Ticket,
  Gift,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Plus,
  Minus,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { RaffleWinnersSection } from "@/features/raffles/ui/RaffleWinnersSection";
import { hasPrizeWinner } from "@/features/raffles/types";
import { RaffleRoulette } from "@/features/raffles/ui/RaffleRoulette";
import { AnimatePresence, motion } from "framer-motion";

interface UserProfile {
  id: string;
  name: string | null;
  steamId: string | null;
  avatar: string | null;
}

interface RafflePrize {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  rarity: string | null;
  exterior: string | null;
  float: number | null;
  pattern: number | null;
  provider: string;
  winnerId?: string | null;
  winner: UserProfile | null;
  winningTicket: { ticketNumber: number } | null;
}

interface RaffleTicket {
  id: string;
  raffleId: string;
  userId: string;
  ticketNumber: number;
  status: string;
  user?: UserProfile;
}

interface Raffle {
  id: string;
  name: string;
  description: string | null;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  status: string;
  prizes: RafflePrize[];
  tickets: RaffleTicket[];
}

function getRarityStyle(rarity: string | null) {
  if (!rarity) return "from-white/5 border-white/5 text-[#84849b]";
  const r = rarity.toLowerCase();
  if (r.includes("cover")) return "from-red-500/10 border-red-500/20 text-red-400";
  if (r.includes("class")) return "from-pink-500/10 border-pink-500/20 text-pink-400";
  if (r.includes("restricted")) return "from-purple-500/10 border-purple-500/20 text-purple-400";
  if (r.includes("mil")) return "from-blue-500/10 border-blue-500/20 text-blue-400";
  return "from-white/5 border-white/5 text-[#84849b]";
}

export function getExteriorAbbr(exterior: string | null) {
  if (!exterior) return null;
  const ext = exterior.toLowerCase();
  if (ext.includes("factory")) return "FN";
  if (ext.includes("minimal")) return "MW";
  if (ext.includes("field")) return "FT";
  if (ext.includes("well")) return "WW";
  if (ext.includes("battle")) return "BS";
  return exterior;
}

function RaffleDetailsContent() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [winningPositions, setWinningPositions] = useState<{position: number; winner: any; prizes: any[]}[]>([]);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

  useEffect(() => {
    fetchWithAuth(`${BACKEND_URL}/users/me`)
      .then(async (res) => {
        if (res.ok) setUserProfile(await res.json());
      })
      .catch(() => {});

    const fetchRaffle = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/raffles/${id}`, {
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (!res.ok) throw new Error("No se pudo cargar la información del sorteo.");
        const data = await res.json();
        setRaffle(data);

        // Check if finished and has a winner
        if (data.status === "FINISHED") {
          try {
            const winnersRes = await fetch(`${BACKEND_URL}/raffles/${id}/winners`, {
              headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
            });
            if (winnersRes.ok) {
              const winnersData = await winnersRes.json();
              data.prizes = data.prizes.map((p: any) => {
                const wInfo = winnersData.find((w: any) => w.prizeId === p.id);
                if (wInfo) {
                  return { ...p, winner: wInfo.winner, winningTicket: wInfo.winningTicket, winnerId: wInfo.winner.id };
                }
                return p;
              });
            }
          } catch (e) {
            console.error("Failed to fetch winners", e);
          }

          const wonPrizes = data.prizes.filter((p: any) => p.winnerId && p.winner);
          if (wonPrizes.length > 0) {
            const positionsMap = new Map<number, any>();
            wonPrizes.forEach((p: any) => {
              const pos = p.position || 1;
              if (!positionsMap.has(pos)) {
                positionsMap.set(pos, { position: pos, winner: p.winner, prizes: [] });
              }
              positionsMap.get(pos).prizes.push(p);
            });
            const positions = Array.from(positionsMap.values()).sort((a, b) => a.position - b.position);
            setWinningPositions(positions);
            setCurrentPrizeIndex(0);
          }
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar.");
      } finally {
        setLoading(false);
      }
    };

    fetchRaffle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-base font-black uppercase text-white tracking-wider mb-2">
          {t("raffles.loadError")}
        </h3>
        <p className="text-xs text-[#84849b] max-w-sm mb-6">{error || t("raffles.notFound")}</p>
        <Link
          href={localizePath("/raffles")}
          className="px-5 py-2.5 rounded-xl bg-accent text-xs font-black uppercase tracking-widest text-white hover:bg-accent/90"
        >
          {t("raffles.backToRaffles")}
        </Link>
      </div>
    );
  }

  const isFinished = raffle.status === "FINISHED";
  const isCancelled = raffle.status === "CANCELLED";
  const isPending = raffle.status === "PENDING";
  const isActive = raffle.status === "ACTIVE";

  const hasSidebar = isActive || isPending || isCancelled;

  const soldTickets = raffle.tickets.filter((t) => t.status === "PAID");
  const myTickets = userProfile
    ? soldTickets.filter((t) => t.userId === userProfile.id)
    : [];

  const remainingChances = raffle.maxTickets != null
    ? Math.max(0, raffle.maxTickets - soldTickets.length)
    : null;
  const isSoldOut = remainingChances !== null && remainingChances === 0;

  const maxTicketCount = remainingChances !== null ? Math.min(remainingChances, 50) : 50;

  const handlePurchase = () => {
    if (!userProfile) {
      alert(t("raffles.loginRequiredAlert"));
      return;
    }
    setIsSubmitting(true);
    router.push(localizePath(`/checkout?type=raffle&raffleId=${raffle.id}&tickets=${ticketCount}`));
  };

  const decrementCount = () => setTicketCount((c) => Math.max(1, c - 1));
  const incrementCount = () =>
    setTicketCount((c) => Math.min(c + 1, maxTicketCount > 0 ? maxTicketCount : c + 1));

  return (
    <AnimatePresence mode="wait">
      {showAnimation && winningPositions.length > 0 ? (
        <motion.div
          key="roulette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-[#0e0c1b]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={winningPositions[currentPrizeIndex].position}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <RaffleRoulette
                tickets={raffle.tickets}
                winner={winningPositions[currentPrizeIndex].winner!}
                prize={{
                  name: t("raffles.position", { position: winningPositions[currentPrizeIndex].position }),
                  price: winningPositions[currentPrizeIndex].prizes.reduce((acc: number, p: any) => acc + p.price, 0),
                  iconUrl: winningPositions[currentPrizeIndex].prizes[0]?.iconUrl,
                  exterior: t("raffles.itemsCount", { count: winningPositions[currentPrizeIndex].prizes.length }),
                  items: winningPositions[currentPrizeIndex].prizes
                }}
                prizeIndex={currentPrizeIndex}
                totalPrizes={winningPositions.length}
                onAnimationEnd={() => {
                  if (currentPrizeIndex < winningPositions.length - 1) {
                    setCurrentPrizeIndex((c) => c + 1);
                  } else {
                    setShowAnimation(false);
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
      <div className={!hasSidebar ? "max-w-5xl mx-auto w-full" : ""}>
        <Link
          href={localizePath("/raffles")}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t("raffles.backToRaffles")}
        </Link>
      </div>

      <div className={`grid grid-cols-1 ${hasSidebar ? "lg:grid-cols-12" : "max-w-5xl mx-auto"} gap-y-8 lg:gap-8 items-start`}>
        {/* 1. Main Info (Left on desktop, First on mobile) */}
        <div className={`${hasSidebar ? "lg:col-span-8 lg:col-start-1" : "w-full"}`}>
          {/* Main Info */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
                {raffle.name}
              </h1>
              {/* Status badge */}
              {isFinished && (
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {t("raffles.status.finished")}
                </span>
              )}
              {isCancelled && (
                <span className="bg-red-500/15 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {t("raffles.status.cancelled")}
                </span>
              )}
              {isPending && (
                <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {t("raffles.status.pending")}
                </span>
              )}
              {isActive && (
                <span className="bg-accent/15 text-accent border border-accent/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
                  {t("raffles.status.active")}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#84849b] leading-relaxed">
              {raffle.description || t("raffles.noDescription")}
            </p>

            {userProfile && myTickets.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {t("raffles.myChances", { count: myTickets.length })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                  {myTickets.map((ticket) => (
                    <span
                      key={ticket.id}
                      className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-black rounded-md"
                    >
                      #{ticket.ticketNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase text-[#84849b] tracking-wider">
                    {t("raffles.drawDate")}
                  </span>
                  <span className="text-xs font-mono font-bold text-white/95">
                    {new Date(raffle.drawDate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase text-[#84849b] tracking-wider">
                    {t("raffles.soldChances")}
                  </span>
                  <span className="text-xs font-mono font-bold text-white/95">
                    {soldTickets.length}
                    {raffle.maxTickets ? ` / ${raffle.maxTickets}` : ""}
                  </span>
                </div>
              </div>

              {raffle.maxTickets && (
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-[10px] font-bold text-[#84849b] uppercase tracking-wider mb-1.5">
                    <span>{t("raffles.remainingAvailable", { count: remainingChances ?? 0 })}</span>
                    <span>{Math.min(100, Math.round((soldTickets.length / raffle.maxTickets) * 100))}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-accent to-accent/60 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((soldTickets.length / raffle.maxTickets) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 2. Action widget (Right on desktop, Second on mobile) */}
        {hasSidebar && (
          <div className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:sticky lg:top-28 space-y-6">
            {isCancelled && (
              <section className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 text-center">
                <Ban className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-sm font-black uppercase text-red-400 mb-1">
                  {t("raffles.cancelledTitle")}
                </h3>
                <p className="text-xs text-[#84849b]">
                  {t("raffles.cancelledDesc")}
                </p>
              </section>
            )}

            {isPending && !isCancelled && (
              <section className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 text-center">
                <Clock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <h3 className="text-sm font-black uppercase text-amber-400 mb-1">
                  {t("raffles.status.pending")}
                </h3>
                <p className="text-xs text-[#84849b]">
                  {t("raffles.pendingDesc")}
                </p>
              </section>
            )}

            {isActive && !isSoldOut && (
              <section className="bg-card border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-accent" />
                  {t("raffles.buyChances")}
                </h3>

                <div className="space-y-6">
                  <div>
                    <span className="block text-[9px] font-bold text-[#84849b] uppercase tracking-wider mb-2">
                      {t("raffles.howManyChances")}
                    </span>

                    <div className="flex items-center justify-between border border-white/5 rounded-2xl bg-background/50 p-2 max-w-[200px]">
                      <button
                        onClick={decrementCount}
                        className="w-9 h-9 rounded-xl hover:bg-white/5 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        disabled={ticketCount <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-mono font-black text-white">{ticketCount}</span>
                      <button
                        onClick={incrementCount}
                        className="w-9 h-9 rounded-xl hover:bg-white/5 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        disabled={maxTicketCount > 0 && ticketCount >= maxTicketCount}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {remainingChances !== null && (
                      <p className="text-[9px] text-[#84849b] font-bold uppercase tracking-wider mt-2">
                        {remainingChances === 1
                          ? t("raffles.maxAvailableOne", { count: remainingChances })
                          : t("raffles.maxAvailable", { count: remainingChances, unit: t("raffles.chances") })}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-[#84849b] uppercase tracking-widest">
                        {t("raffles.totalPrice")}
                      </span>
                      <span className="block text-lg font-black text-white">
                        ${(raffle.ticketPrice * ticketCount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-black text-accent uppercase tracking-wider">
                        ${raffle.ticketPrice.toFixed(2)} c/u
                      </span>
                    </div>
                  </div>

                  {userProfile ? (
                    <button
                      onClick={handlePurchase}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-accent hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />
                          {t("raffles.buyTickets")}
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center p-4 border border-white/5 rounded-2xl bg-white/[0.01]">
                      <p className="text-[10px] font-bold text-[#84849b] uppercase tracking-wider mb-2">
                        {t("raffles.loginToParticipate")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `${BACKEND_URL}/auth/steam`;
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors cursor-pointer"
                      >
                        {t("raffles.connectAccount")} &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {isActive && isSoldOut && (
              <section className="bg-card border border-white/5 rounded-3xl p-6 text-center">
                <Ticket className="w-8 h-8 text-[#84849b] mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-black uppercase text-white mb-1">{t("raffles.soldOutTitle")}</h3>
                <p className="text-xs text-[#84849b]">
                  {t("raffles.soldOutDesc")}
                </p>
              </section>
            )}
          </div>
        )}

        {/* 3. Prizes (Left on desktop, Third on mobile) */}
        <div className={`${hasSidebar ? "lg:col-span-8 lg:col-start-1" : "w-full"} space-y-8`}>

          {isFinished && (
            <RaffleWinnersSection
              prizes={raffle.prizes}
              currentUserId={userProfile?.id}
              drawDate={raffle.drawDate}
              variant="hero"
              t={t}
            />
          )}

          {/* Prizes */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent rounded-full" />
              {t("raffles.prizes")} ({raffle.prizes.length})
            </h2>

            <div className="flex flex-col gap-4">
              {raffle.prizes.map((prize) => {
                const hasWinner = hasPrizeWinner(prize);
                const rarityStyle = getRarityStyle(prize.rarity);

                return (
                  <div
                    key={prize.id}
                    className={`flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b ${rarityStyle} border shadow-xl relative overflow-hidden`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">
                          <span className="text-accent mr-1">#{prize.position || 1}</span>
                          {prize.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          {prize.exterior && (
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-2 py-0.5 rounded-md border border-white/10">
                              {getExteriorAbbr(prize.exterior)}
                            </span>
                          )}
                        </div>
                        <span className="block text-sm font-black text-emerald-400 mt-2">
                          ${prize.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="relative w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-1 shrink-0">
                        {prize.iconUrl ? (
                          <img
                            src={prize.iconUrl}
                            alt={prize.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Gift className="w-6 h-6 text-accent/40" />
                        )}
                      </div>
                    </div>

                    {hasWinner && !isFinished && (
                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30 shrink-0">
                          {prize.winner?.avatar ? (
                            <img
                              src={prize.winner.avatar}
                              alt={prize.winner.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-muted absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                            {t("raffles.wonBy")}
                          </span>
                          <span className="block text-[10px] font-black text-white truncate">
                            {prize.winner?.name || "Usuario Steam"}
                          </span>
                          {prize.winningTicket && (
                            <span className="block text-[8px] font-mono text-[#84849b] uppercase">
                              {t("raffles.ticketNumber", { number: prize.winningTicket.ticketNumber })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

export default function RaffleDetailsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
            <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          </div>
        }
      >
        <RaffleDetailsContent />
      </Suspense>
    </main>
  );
}
