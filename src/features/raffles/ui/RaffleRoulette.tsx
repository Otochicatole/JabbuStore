"use client";

import { useEffect, useState, useRef } from "react";
import { User as UserIcon, Volume2, VolumeX, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface UserProfile {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Ticket {
  userId: string;
  user?: UserProfile;
}

interface RaffleRouletteProps {
  tickets: Ticket[];
  winner: UserProfile;
  prize?: any;
  prizeIndex?: number;
  totalPrizes?: number;
  onAnimationEnd: () => void;
}

const TOTAL_CARDS = 100;
const START_INDEX = 15;
const WINNER_INDEX = 85; // Stop at this index
const ANIMATION_DURATION = 8000; // 8 seconds

export function RaffleRoulette({
  tickets,
  winner,
  prize,
  prizeIndex,
  totalPrizes,
  onAnimationEnd,
}: RaffleRouletteProps) {
  const [cards, setCards] = useState<UserProfile[]>([]);
  const { t } = useI18n();
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);
  const [isPrizeListOpen, setIsPrizeListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // Volume state
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('raffle_volume');
      return saved !== null ? parseFloat(saved) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('raffle_muted') === 'true';
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = isMobile ? 140 : 220;
  const cardHeight = isMobile ? 200 : 320;
  const cardGap = isMobile ? 10 : 16;
  const itemSize = cardWidth + cardGap;

  useEffect(() => {
    spinAudioRef.current = new Audio("/sounds/raffles.mp3");
    winAudioRef.current = new Audio("/sounds/win.mp3");

    return () => {
      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current) winAudioRef.current.pause();
    };
  }, []);

  // Sync volume
  useEffect(() => {
    localStorage.setItem('raffle_volume', volume.toString());
    localStorage.setItem('raffle_muted', isMuted.toString());
    
    const effectiveVolume = isMuted ? 0 : volume;
    if (spinAudioRef.current) spinAudioRef.current.volume = effectiveVolume;
    if (winAudioRef.current) winAudioRef.current.volume = effectiveVolume * 0.5;
  }, [volume, isMuted]);

  // Calculate random offset only once on mount
  const [randomOffset] = useState(() => {
    const maxOffset = 140 / 2 - 10; // Use base mobile width logic to be safe across resizes
    return Math.floor(Math.random() * (maxOffset * 2)) - maxOffset;
  });

  useEffect(() => {
    // Generate the sequence of cards
    const users = tickets
      .filter((t) => t.user)
      .map((t) => t.user as UserProfile);

    if (users.length === 0) {
      // Fallback if no users (shouldn't happen if there is a winner)
      users.push(winner);
    }

    const sequence: UserProfile[] = [];
    for (let i = 0; i < TOTAL_CARDS; i++) {
      if (i === WINNER_INDEX) {
        sequence.push(winner);
      } else {
        // Pick a random user from participants to simulate the roulette
        const randomUser = users[Math.floor(Math.random() * users.length)];
        sequence.push(randomUser);
      }
    }
    setCards(sequence);
  }, [tickets, winner]);

  const handleStart = () => {
    if (hasStarted) return;
    setHasStarted(true);
    setIsSpinning(true);

    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(e => console.error("Error playing spin sound:", e));
    }

    setTimeout(() => {
      setHasStopped(true);
      if (spinAudioRef.current) spinAudioRef.current.pause();

      // Trigger confetti from the custom canvas, behind the z-40 winning card
      if (canvasRef.current) {
        const myConfetti = confetti.create(canvasRef.current, {
          resize: true,
          useWorker: true
        });

        myConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5, x: 0.5 },
          startVelocity: 45,
          colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
        });

        myConfetti({
          particleCount: 80,
          spread: 360,
          origin: { y: 0.5, x: 0.5 },
          colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
          ticks: 200,
          gravity: 1.2,
          scalar: 1.5,
          shapes: ['square']
        });
      }
      
      setTimeout(() => {
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play().catch(e => console.error("Error playing win sound:", e));
        }
      }, 200);
    }, ANIMATION_DURATION);

    setTimeout(() => {
      onAnimationEnd();
    }, ANIMATION_DURATION + 6000);
  };

  const handleSkip = () => {
    if (spinAudioRef.current) spinAudioRef.current.pause();
    if (winAudioRef.current) winAudioRef.current.pause();
    onAnimationEnd();
  };

  // Calculate the final translation
  // We want the winner card to be roughly in the center
  // Center of screen: window.innerWidth / 2
  // Card offset: WINNER_INDEX * itemSize

  const transformStyle = isSpinning
    ? `translateX(calc(50vw - ${WINNER_INDEX * itemSize + cardWidth / 2 + randomOffset}px))`
    : `translateX(calc(50vw - ${START_INDEX * itemSize + cardWidth / 2}px))`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0c1b] overflow-hidden">
      {/* Custom Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* Audio Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[60] flex items-center gap-2 sm:gap-3 bg-black/40 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            if (val > 0) setIsMuted(false);
          }}
          className="w-16 sm:w-24 accent-accent cursor-pointer"
        />
      </div>

      {/* Top Banner for the Prize */}
      {prize && (
        <div className="absolute top-[72px] sm:top-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 duration-500 w-full max-w-[90vw] sm:max-w-none">
          {totalPrizes && totalPrizes > 1 && (
            <span className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full text-[10px] font-black uppercase text-accent tracking-widest shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
              {t("raffles.drawingPrize", { current: prizeIndex !== undefined ? prizeIndex + 1 : 1, total: totalPrizes })}
            </span>
          )}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsPrizeListOpen(!isPrizeListOpen)}
              className={`cursor-pointer flex items-center justify-between w-full sm:min-w-[280px] gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${isPrizeListOpen ? 'bg-[#14121d] border-accent/40 shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)]' : 'bg-[#14121d]/80 border-white/5 hover:bg-[#14121d] hover:border-white/10'}`}
            >
              <div className="flex items-center gap-4">
                {prize.iconUrl && (
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
                    <img src={prize.iconUrl} alt={prize.name} className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-white font-black uppercase tracking-wider text-xs sm:text-sm leading-none mb-1 sm:mb-1.5 truncate max-w-[150px] sm:max-w-none">{prize.name}</span>
                  <div className="flex items-center gap-2">
                    {prize.exterior && (
                      <span className="text-[9px] font-black uppercase text-white/80 bg-white/10 px-1.5 py-0.5 rounded-[4px] border border-white/5">
                        {prize.exterior}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-emerald-400">
                      ${prize.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              {prize.items && prize.items.length > 0 && (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shrink-0 ml-2">
                  <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isPrizeListOpen ? 'rotate-180 text-accent' : ''}`} />
                </div>
              )}
            </button>

            {/* Dropdown with items */}
            {isPrizeListOpen && prize.items && prize.items.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0e0c1b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {prize.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/30 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center shrink-0 p-1 relative overflow-hidden">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                        {item.iconUrl && (
                          <img src={item.iconUrl} alt={item.name} className="relative z-10 w-full h-full object-contain" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-black text-white truncate uppercase tracking-wide">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.exterior && (
                            <span className="text-[8px] font-bold text-white/50 uppercase">{item.exterior}</span>
                          )}
                          <span className="text-[10px] text-emerald-400 font-black">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[60] px-3 sm:px-5 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 cursor-pointer"
      >
        {t("raffles.skipAnimation")}
      </button>

      {/* Center line indicator */}
      <div className="absolute top-1/2 left-1/2 w-0.5 sm:w-1 h-[260px] sm:h-[460px] bg-accent z-20 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />

      {/* Roulette container */}
      <div className="relative w-full border-t border-b border-white/10 py-6 bg-black/10">
        {/* Gradients for edges */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-[#0e0c1b] to-transparent z-10" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-[#0e0c1b] to-transparent z-10" />

        <div
          ref={containerRef}
          className="flex items-center"
          style={{
            transform: transformStyle,
            transition: isSpinning
              ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.1, 0.1, 0.6, 1)`
              : "none",
            gap: `${cardGap}px`,
          }}
        >
          {cards.map((user, idx) => {
            const isWinner = idx === WINNER_INDEX;
            const isLeft = idx < WINNER_INDEX;
            const isRight = idx > WINNER_INDEX;
            
            let extraClasses = "z-0 scale-100 translate-x-0";
            if (hasStopped) {
              if (isWinner) {
                extraClasses = "scale-[1.35] z-40 shadow-[0_0_60px_rgba(var(--accent-rgb),0.8)] border-accent translate-x-0";
              } else if (isLeft) {
                extraClasses = "-translate-x-[50px] z-10 opacity-30 scale-[0.90]";
              } else if (isRight) {
                extraClasses = "translate-x-[50px] z-10 opacity-30 scale-[0.90]";
              }
            }

            return (
              <div
                key={idx}
                style={{ width: cardWidth, height: cardHeight }}
                className={`flex flex-col p-3 sm:p-4 rounded-xl bg-[#14121d] border border-white/5 relative overflow-hidden shrink-0 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${extraClasses}`}
              >
                {/* Header */}
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider truncate w-full">
                  <span className="text-white shrink-0">★ PARTICIPANTE</span>
                  <span className="text-white/20 shrink-0">|</span>
                  <span className="text-fuchsia-500 truncate">
                    {user.name || "USUARIO"}
                  </span>
                </div>

                {/* Sub-header */}
                <div className="flex items-center justify-between mt-2 sm:mt-4">
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                    TICKET ACTIVO
                  </span>
                  <span className="text-[9px] font-mono text-white/40">
                    ID: {user.id.slice(0, 5)}
                  </span>
                </div>

                {/* Fake Float Bar */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-white/30">
                    Float
                  </span>
                  <span className="text-[9px] font-black text-white/80">
                    USER
                  </span>
                </div>
                <div className="mt-1 w-full h-[3px] bg-white/5 rounded-full flex overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[12%]" />
                  <div className="h-full bg-white/5 rounded-full w-[1%]" />
                  <div className="h-full bg-white/10 rounded-full w-[20%]" />
                </div>

                {/* Avatar / Image */}
                <div className="flex-1 flex items-center justify-center relative mt-2 sm:mt-4 mb-2 sm:mb-4">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 sm:w-32 h-20 sm:h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-2xl relative z-10 border border-white/5 bg-black/20">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Red Line */}
                <div className="w-full h-0.5 bg-[#ff3535] mb-2 shadow-[0_0_12px_rgba(255,53,53,0.6)]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      {!hasStarted && (
        <div className="absolute bottom-8 sm:bottom-16 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={handleStart}
            className="px-6 sm:px-10 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Ver Ganador
          </button>
        </div>
      )}
    </div>
  );
}
