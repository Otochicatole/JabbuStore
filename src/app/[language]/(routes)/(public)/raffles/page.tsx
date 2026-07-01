"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2, Ticket, Gift, Calendar, AlertCircle } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { BACKEND_URL } from "@/shared/lib/api";

interface RafflePrize {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  exterior: string | null;
  float: number | null;
  provider: string;
}

interface Raffle {
  id: string;
  name: string;
  description: string | null;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  status: string; // PENDING, ACTIVE, FINISHED, CANCELLED
  prizes: RafflePrize[];
  tickets: { id: string; status: string }[];
}

function TimeRemaining({ drawDate }: { drawDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(drawDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft("Comenzando sorteo...");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      const daysStr = days > 0 ? `${days}d ` : "";
      const hoursStr = hours > 0 ? `${hours}h ` : "";
      const minsStr = `${minutes}m`;

      setTimeLeft(`${daysStr}${hoursStr}${minsStr}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [drawDate]);

  return <span>{timeLeft}</span>;
}

function RafflesListContent() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaffles = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/raffles`, {
          headers: {
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
        });
        if (!response.ok) {
          throw new Error("Error al obtener los sorteos");
        }
        const data = await response.json();
        setRaffles(data);
      } catch (err: any) {
        console.error("Error fetching raffles:", err);
        setError(err.message || "Error de red.");
      } finally {
        setLoading(false);
      }
    };
    fetchRaffles();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-base font-black uppercase text-white tracking-wider mb-2">Error al cargar</h3>
        <p className="text-xs text-[#84849b] max-w-sm mb-6">{error}</p>
      </div>
    );
  }

  if (raffles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <Gift className="w-12 h-12 text-muted mb-4 opacity-50" />
        <p className="text-sm font-semibold text-[#84849b]">{t("raffles.noRaffles")}</p>
      </div>
    );
  }

  const statusOrder: Record<string, number> = { ACTIVE: 0, PENDING: 1, FINISHED: 2 };
  const sortedRaffles = [...raffles]
    .filter((r) => r.status !== "CANCELLED")
    .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {sortedRaffles.map((raffle) => {
        const soldTickets = raffle.tickets.filter((t) => t.status === "PAID").length;
        const totalPrizes = raffle.prizes.length;
        const isFinished = raffle.status === "FINISHED";
        
        // Progress bar calculation
        const percentSold = raffle.maxTickets ? Math.min(100, Math.round((soldTickets / raffle.maxTickets) * 100)) : 0;

        return (
          <Link
            href={localizePath(`/raffles/${raffle.id}`)}
            key={raffle.id}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-card/40 border border-white/5 hover:border-accent/40 shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
              {/* Header Image / Prize Preview */}
              <div className="relative h-44 bg-gradient-to-b from-white/[0.02] to-card/10 flex items-center justify-center border-b border-white/5 p-6 select-none shrink-0 overflow-hidden">
                {raffle.prizes[0]?.iconUrl ? (
                  <img
                    src={raffle.prizes[0].iconUrl}
                    alt={raffle.prizes[0].name}
                    className="w-36 h-36 object-contain drop-shadow-[0_8px_24px_rgba(217,70,239,0.25)] transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <Gift className="w-16 h-16 text-accent/50" />
                )}
                {totalPrizes > 1 && (
                  <div className="absolute right-4 bottom-4 bg-[#0e0c1b] border border-white/10 text-[9px] font-black uppercase tracking-wider text-white px-2 py-1 rounded">
                    +{totalPrizes - 1} {t("raffles.prizes").toLowerCase()}
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                  {isFinished ? (
                    <span className="bg-[#12b76a]/15 text-[#12b76a] border border-[#12b76a]/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {t("raffles.status.finished")}
                    </span>
                  ) : raffle.status === "PENDING" ? (
                    <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {t("raffles.status.pending")}
                    </span>
                  ) : (
                    <span className="bg-accent/15 text-accent border border-accent/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
                      {t("raffles.status.active")}
                    </span>
                  )}
                </div>
              </div>

              {/* Raffle Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide truncate group-hover:text-accent transition-colors leading-tight mb-2">
                    {raffle.name}
                  </h3>
                  <p className="text-xs text-[#84849b] line-clamp-2 mb-4 min-h-[2rem]">
                    {raffle.description || "Sin descripción proporcionada."}
                  </p>
                </div>

                {/* Sales Info / Progress */}
                <div className="space-y-3.5 pt-2 border-t border-white/5">
                  {raffle.maxTickets ? (
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-[#84849b] uppercase tracking-wider mb-1.5">
                        <span>Chances: {soldTickets} / {raffle.maxTickets}</span>
                        <span>{percentSold}%</span>
                      </div>
                      <div className="w-full bg-[#181628] rounded-full h-1.5 border border-white/5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-accent to-accent/60 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#84849b] uppercase tracking-wider">
                      <Ticket className="w-3.5 h-3.5 text-accent" />
                      <span>{soldTickets} {t("raffles.sold")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-[#84849b] uppercase tracking-widest">{t("raffles.ticketPrice")}</span>
                      <span className="text-sm font-black text-white">${raffle.ticketPrice.toFixed(2)}</span>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[9px] font-bold text-[#84849b] uppercase tracking-widest">
                        {isFinished ? t("raffles.drawDate") : t("raffles.endsIn")}
                      </span>
                      <span className="text-[10px] font-mono font-black text-white/95 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-accent" />
                        {isFinished ? (
                          new Date(raffle.drawDate).toLocaleDateString()
                        ) : (
                          <TimeRemaining drawDate={raffle.drawDate} />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent group-hover:text-white transition-colors">
                {isFinished ? "Ver ganadores & premios" : "Participar ahora"} &rarr;
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function RafflesListPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans">
      <header className="mb-10 text-left">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
          {t("raffles.title")}
        </h1>
        <p className="text-sm text-[#84849b] mt-1 max-w-2xl">
          {t("raffles.description")}
        </p>
      </header>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
          <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">Cargando...</p>
        </div>
      }>
        <RafflesListContent />
      </Suspense>
    </main>
  );
}
