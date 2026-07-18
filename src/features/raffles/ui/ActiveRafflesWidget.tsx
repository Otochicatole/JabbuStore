"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Timer, Ticket, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { BACKEND_URL } from "@/shared/lib/api";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Money } from "@/features/currency/ui/Money";

interface RafflePrize {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface ActiveRaffle {
  id: string;
  name: string;
  drawDate: string;
  ticketPrice: number;
  prizes: RafflePrize[];
}

function RaffleCountdown({ drawDate }: { drawDate: string }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(drawDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft("00:00:00");
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
  }, [drawDate]);

  return <span className="font-mono text-[10px] tracking-wider text-amber-300">{timeLeft}</span>;
}

export function ActiveRafflesWidget() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [activeRaffles, setActiveRaffles] = useState<ActiveRaffle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchActiveRaffles = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/raffles`, {
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" }
        });
        if (res.ok) {
          const data = await res.json();
          const active = data.filter((r: any) => r.status === "ACTIVE");
          setActiveRaffles(active);
        }
      } catch (e) {
        console.error("Failed to fetch active raffles for widget", e);
      } finally {
        setHasLoaded(true);
      }
    };

    fetchActiveRaffles();
    
    // Optional: Refresh every 5 minutes
    const interval = setInterval(fetchActiveRaffles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!hasLoaded || activeRaffles.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -6, 0] 
            }}
            transition={{
              y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
              default: { duration: 0.3 }
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#0e0c1b]/90 backdrop-blur-md shadow-[0_0_25px_rgba(251,191,36,0.35)] border border-amber-400/50 text-white cursor-pointer group hover:border-amber-400 hover:bg-[#0e0c1b] transition-colors"
          >
            {/* Animated radiating ring for attention */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40 pointer-events-none" />
            
            {/* Soft inner glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none" />
            
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            
            <div className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]">
              {activeRaffles.length}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] sm:bg-transparent sm:backdrop-blur-none"
          />
        )}
      </AnimatePresence>

      {/* Slide-out Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-80 bg-amber-950/20 backdrop-blur-2xl border-l border-amber-400/30 shadow-[-10px_0_60px_rgba(251,191,36,0.15)] z-[100] flex flex-col"
          >
            {/* Decorative background glow inside aside */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-b from-amber-500/10 to-transparent flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/30 shadow-[inset_0_0_15px_rgba(251,191,36,0.1)]">
                  <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">
                    Sorteos Activos
                  </h2>
                  <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-widest">
                    ¡No te quedes afuera!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Gradient separator */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            </div>

            {/* List */}
            <div className="relative flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent z-10">
              {activeRaffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  href={localizePath(`/raffles/${raffle.id}`)}
                  onClick={() => setIsOpen(false)}
                  className="block group relative overflow-hidden bg-transparent border-b border-white/5 last:border-0 hover:bg-amber-500/5 transition-colors duration-300"
                >
                  <div className="px-6 py-4 flex gap-4 relative z-10">
                    <div className="w-16 h-16 flex items-center justify-center shrink-0 relative">
                      {raffle.prizes[0]?.iconUrl ? (
                        <img 
                          src={raffle.prizes[0].iconUrl} 
                          alt="Prize"
                          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Gift className="w-6 h-6 text-amber-500/50" />
                      )}
                      
                      {/* Glow on hover */}
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-xs font-black text-white uppercase tracking-wide truncate group-hover:text-amber-300 transition-colors drop-shadow-sm">
                        {raffle.name}
                      </h3>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <RaffleCountdown drawDate={raffle.drawDate} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5 text-[#8984a1]" />
                          <span className="text-[10px] font-bold text-[#8984a1] uppercase tracking-widest">
                            Valor: <Money amountUsd={raffle.ticketPrice} className="text-white" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Footer */}
            <div className="relative p-5 bg-black/20 shrink-0 z-10">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <Link
                href={localizePath("/raffles")}
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-widest transition-all duration-300 bg-white/[0.03] backdrop-blur-md border border-white/10 text-white/80 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:scale-[1.02] cursor-pointer"
              >
                Ver todos los sorteos
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
