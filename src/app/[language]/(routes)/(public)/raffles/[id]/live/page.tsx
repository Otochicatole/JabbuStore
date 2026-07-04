"use client";

import { useEffect, useState, use } from "react";
import { BACKEND_URL } from "@/shared/lib/api";
import { io, Socket } from "socket.io-client";
import { RaffleRoulette } from "@/features/raffles/ui/RaffleRoulette";
import { Loader2, Users, Trophy, Clock, Ticket, Gift, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

interface LiveDrawPageProps {
  params: Promise<{
    id: string;
    language: string;
  }>;
}

export default function LiveDrawPage({ params }: LiveDrawPageProps) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const localizePath = useLocalizedPath();

  const [raffle, setRaffle] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [drawState, setDrawState] = useState<"WAITING" | "STARTING" | "DRAWING" | "FINISHED">("WAITING");
  
  // States for sequential roulette rounds
  const [allWinners, setAllWinners] = useState<any[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [winner, setWinner] = useState<any>(null);
  const [winningPrize, setWinningPrize] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Update current winner and prize when round index or winners list changes
  useEffect(() => {
    if (allWinners.length > 0 && raffle) {
      const currentWinner = allWinners[currentRoundIndex];
      if (currentWinner) {
        setWinner({
          id: currentWinner.winnerId,
          name: currentWinner.user?.name || "Ganador",
          avatar: currentWinner.user?.avatar || null,
        });
        const prize = raffle.prizes?.find((p: any) => p.id === currentWinner.prizeId);
        setWinningPrize(prize);
      }
    }
  }, [allWinners, currentRoundIndex, raffle]);

  // Real-time countdown timer
  useEffect(() => {
    if (!raffle) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const drawTime = new Date(raffle.drawDate).getTime();
      const diff = drawTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
      } else {
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(
          [h, m, s].map((v) => (v < 10 ? "0" + v : v)).join(":")
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [raffle]);

  useEffect(() => {
    // 1. Fetch raffle data to know if it's already finished or not
    const fetchRaffle = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/raffles/${id}`);
        if (!res.ok) return router.push(localizePath(`/raffles/${id}`));
        const data = await res.json();
        setRaffle(data);
        if (data.status === "FINISHED") {
          // If already finished, redirect back to normal page
          router.push(localizePath(`/raffles/${id}`));
        }
      } catch (err) {
        console.error("Failed to load raffle for live draw:", err);
      }
    };
    fetchRaffle();

    // 2. Connect to Socket
    const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    let socketOrigin = "http://localhost:3001";
    try {
      socketOrigin = new URL(configured).origin;
    } catch (e) {
      console.error("Invalid NEXT_PUBLIC_API_URL configuration:", e);
    }

    const s = io(socketOrigin, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      // Guest connection, no auth token needed
    });

    s.on("connect", () => {
      s.emit("raffle:join_live", { raffleId: id });
    });

    s.on("raffle:live:start", () => {
      setDrawState("STARTING");
    });

    s.on("raffle:live:result", (data: any) => {
      if (data.winners && data.winners.length > 0) {
        setAllWinners(data.winners);
        setCurrentRoundIndex(0);
        setDrawState("DRAWING");
      } else {
        setDrawState("FINISHED");
        setTimeout(() => {
          router.push(localizePath(`/raffles/${id}`));
        }, 3000);
      }
    });

    setSocket(s);

    return () => {
      s.emit("raffle:leave_live", { raffleId: id });
      s.disconnect();
    };
  }, [id, router, localizePath]);

  if (!raffle) {
    return (
      <div className="min-h-[80vh] pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleAnimationEnd = () => {
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < allWinners.length) {
      setDrawState("STARTING");
      // Give a 2.5s transition before the next round begins
      setTimeout(() => {
        setCurrentRoundIndex(nextIndex);
        setDrawState("DRAWING");
      }, 2500);
    } else {
      setDrawState("FINISHED");
      setTimeout(() => {
        router.push(localizePath(`/raffles/${id}`));
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center p-4">
      {drawState === "WAITING" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          {/* Main Card */}
          <div className="w-full bg-[#110e1a] border border-white/5 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[200px] bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-accent/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_40px_rgba(var(--accent-rgb),0.3)]">
                <Trophy className="w-12 h-12 text-accent animate-pulse drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-accent" />
                Sorteo en Directo
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase tracking-tighter mb-4">
                {raffle.name}
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
                <div className="flex items-center gap-2 text-white/60">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {raffle.prizes?.length || 1} Premios
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {raffle.tickets?.length || 0} Participantes
                  </span>
                </div>
              </div>

              {/* Countdown or Waiting Status */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 w-full max-w-md mx-auto backdrop-blur-md">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <h3 className="text-white font-black uppercase tracking-widest text-lg">
                    Conectando...
                  </h3>
                  <p className="text-white/40 text-xs text-center max-w-[250px]">
                    Mantén esta pestaña abierta. La ruleta girará automáticamente.
                  </p>
                  
                  {timeLeft && (
                    <div className="mt-4 pt-4 border-t border-white/5 w-full text-center">
                      <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
                        Inicia en aprox:
                      </span>
                      <span className="text-2xl font-black text-white font-mono tracking-wider">
                        {timeLeft}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawState === "STARTING" && (
        <div className="text-center animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-accent" />
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-accent to-fuchsia-500 uppercase tracking-tighter">
            {currentRoundIndex > 0 ? "¡Siguiente Premio!" : "¡Prepárate!"}
          </h1>
          <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
            {currentRoundIndex > 0 
              ? `Preparando ronda ${currentRoundIndex + 1} de ${allWinners.length}...`
              : "Generando resultados..."
            }
          </p>
        </div>
      )}

      {drawState === "DRAWING" && winner && (
        <div className="fixed inset-0 z-50">
          <RaffleRoulette
            tickets={raffle.tickets || []}
            winner={winner}
            prize={winningPrize}
            prizeIndex={currentRoundIndex}
            totalPrizes={allWinners.length}
            autoStart={true}
            onAnimationEnd={handleAnimationEnd}
          />
        </div>
      )}
      
      {drawState === "FINISHED" && (
        <div className="text-center">
          <h1 className="text-4xl font-black text-white uppercase">Sorteo finalizado</h1>
          <p className="text-white/60 mt-4">Redirigiendo a los resultados...</p>
        </div>
      )}
    </div>
  );
}
