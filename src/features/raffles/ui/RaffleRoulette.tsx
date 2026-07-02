"use client";

import { useEffect, useState, useRef } from "react";
import { User as UserIcon } from "lucide-react";
import confetti from "canvas-confetti";

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
  onAnimationEnd: () => void;
}

const CARD_WIDTH = 220; // width of each card in px
const CARD_HEIGHT = 320; // height of each card in px
const CARD_GAP = 16; // gap between cards
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;
const TOTAL_CARDS = 100;
const START_INDEX = 15;
const WINNER_INDEX = 85; // Stop at this index
const ANIMATION_DURATION = 8000; // 8 seconds

export function RaffleRoulette({
  tickets,
  winner,
  onAnimationEnd,
}: RaffleRouletteProps) {
  const [cards, setCards] = useState<UserProfile[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinAudioRef.current = new Audio("/sounds/raffles.mp3");
    winAudioRef.current = new Audio("/sounds/win.mp3");
    
    if (winAudioRef.current) {
      winAudioRef.current.volume = 0.5;
    }

    return () => {
      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current) winAudioRef.current.pause();
    };
  }, []);

  // Calculate random offset only once on mount
  const [randomOffset] = useState(() => {
    const maxOffset = CARD_WIDTH / 2 - 10;
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
      }, 1000);
    }, ANIMATION_DURATION);

    setTimeout(() => {
      onAnimationEnd();
    }, ANIMATION_DURATION + 10000);
  };

  const handleSkip = () => {
    if (spinAudioRef.current) spinAudioRef.current.pause();
    if (winAudioRef.current) winAudioRef.current.pause();
    onAnimationEnd();
  };

  // Calculate the final translation
  // We want the winner card to be roughly in the center
  // Center of screen: window.innerWidth / 2
  // Card offset: WINNER_INDEX * ITEM_SIZE

  const transformStyle = isSpinning
    ? `translateX(calc(50vw - ${WINNER_INDEX * ITEM_SIZE + CARD_WIDTH / 2 + randomOffset}px))`
    : `translateX(calc(50vw - ${START_INDEX * ITEM_SIZE + CARD_WIDTH / 2}px))`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0c1b] overflow-hidden">
      {/* Custom Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-[60] px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 cursor-pointer"
      >
        Saltar Animación
      </button>

      {/* Center line indicator */}
      <div className="absolute top-1/2 left-1/2 w-1 h-[460px] bg-accent z-20 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />

      {/* Roulette container */}
      <div className="relative w-full">
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
            gap: `${CARD_GAP}px`,
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
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                className={`flex flex-col p-4 rounded-xl bg-[#14121d] border border-white/5 relative overflow-hidden shrink-0 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${extraClasses}`}
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
                <div className="flex items-center justify-between mt-4">
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
                <div className="flex-1 flex items-center justify-center relative mt-4 mb-4">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="w-28 h-28 rounded-xl overflow-hidden shadow-2xl relative z-10 border border-white/5 bg-black/20">
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
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Ver Ganador
          </button>
        </div>
      )}
    </div>
  );
}
