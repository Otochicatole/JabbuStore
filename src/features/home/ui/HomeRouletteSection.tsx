"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, Volume2, VolumeX, Zap } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

interface RouletteSkin {
  id: string;
  name: string;
  weapon: string;
  skin: string;
  image: string;
  rarityHex: string;
  tierLabel: string;
  priceUsd: number;
  floatValue: string;
  weight: number;
}

const DEMO_SKINS: RouletteSkin[] = [
  {
    id: "pandora",
    name: "Sport Gloves | Pandora's Box",
    weapon: "Sport Gloves",
    skin: "Pandora's Box",
    image: "/category-images/gloves-steam.png",
    rarityHex: "#e4ae39",
    tierLabel: "Rare Special Item",
    priceUsd: 5420,
    floatValue: "0.0912",
    weight: 6,
  },
  {
    id: "stiletto",
    name: "Stiletto Knife | Case Hardened",
    weapon: "Stiletto Knife",
    skin: "Case Hardened",
    image: "/category-images/knives-steam.png",
    rarityHex: "#e4ae39",
    tierLabel: "Rare Special Item",
    priceUsd: 890,
    floatValue: "0.0751",
    weight: 10,
  },
  {
    id: "howl",
    name: "M4A4 | Howl",
    weapon: "M4A4",
    skin: "Howl",
    image: "/category-images/rifles-steam.png",
    rarityHex: "#eb4b4b",
    tierLabel: "Covert",
    priceUsd: 4650,
    floatValue: "0.0418",
    weight: 12,
  },
  {
    id: "medusa",
    name: "AWP | Medusa",
    weapon: "AWP",
    skin: "Medusa",
    image: "/category-images/snipers-steam.png",
    rarityHex: "#eb4b4b",
    tierLabel: "Covert",
    priceUsd: 2980,
    floatValue: "0.1124",
    weight: 16,
  },
  {
    id: "deagle",
    name: "Desert Eagle | Printstream",
    weapon: "Desert Eagle",
    skin: "Printstream",
    image: "/category-images/pistols-steam.png",
    rarityHex: "#d32ce6",
    tierLabel: "Classified",
    priceUsd: 165,
    floatValue: "0.0295",
    weight: 24,
  },
  {
    id: "smg",
    name: "MP9 | Starlight Protector",
    weapon: "MP9",
    skin: "Starlight Protector",
    image: "/category-images/smgs-steam.png",
    rarityHex: "#4b69ff",
    tierLabel: "Mil-Spec",
    priceUsd: 48,
    floatValue: "0.0610",
    weight: 32,
  },
];

const REEL_LENGTH = 46;
const WINNING_INDEX = 35;
const CARD_GAP_PX = 10;
const TRACK_PADDING_X = 16;

function buildWeightedReel(seedOffset: number): RouletteSkin[] {
  const weightedPool: RouletteSkin[] = [];
  for (const item of DEMO_SKINS) {
    const slots = Math.max(1, Math.round(item.weight / 4));
    for (let i = 0; i < slots; i += 1) {
      weightedPool.push(item);
    }
  }

  const reel: RouletteSkin[] = [];
  for (let i = 0; i < REEL_LENGTH; i += 1) {
    const idx =
      (i * 7 + seedOffset + Math.floor(Math.random() * weightedPool.length)) %
      weightedPool.length;
    reel.push(weightedPool[idx] ?? DEMO_SKINS[0]!);
  }
  return reel;
}

function renderHighlightedSimulation(text: string) {
  const parts = text.split(/(Simulación|Simulação|Simulation|simulación|simulação|simulation)/g);
  return parts.map((part, idx) =>
    /^(Simulación|Simulação|Simulation)$/i.test(part) ? (
      <strong
        key={idx}
        className="font-bold text-[#f0abfc] underline decoration-[#d946ef] decoration-2 underline-offset-2"
      >
        {part}
      </strong>
    ) : (
      part
    )
  );
}

export function HomeRouletteSection() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const winAudioTimerRef = useRef<number | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const [reel, setReel] = useState<RouletteSkin[]>(() =>
    Array.from({ length: REEL_LENGTH }, (_, idx) => DEMO_SKINS[idx % DEMO_SKINS.length]!)
  );
  const [translateX, setTranslateX] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteSkin | null>(null);
  const [turboMode, setTurboMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inspectedId, setInspectedId] = useState<string>(DEMO_SKINS[0]!.id);
  const [spinCount, setSpinCount] = useState(0);

  const inspectedSkin = useMemo(
    () => DEMO_SKINS.find((item) => item.id === inspectedId) ?? DEMO_SKINS[0]!,
    [inspectedId]
  );

  useEffect(() => {
    if (confettiCanvasRef.current && !confettiInstanceRef.current) {
      try {
        confettiInstanceRef.current = confetti.create(confettiCanvasRef.current, {
          resize: true,
          useWorker: false,
        });
      } catch {
        confettiInstanceRef.current = null;
      }
    }

    try {
      const winAudio = new Audio("/sounds/win.mp3");
      winAudio.volume = 0.4;
      winAudioRef.current = winAudio;
    } catch {
      winAudioRef.current = null;
    }

    return () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
      if (winAudioTimerRef.current !== null) {
        window.clearTimeout(winAudioTimerRef.current);
      }
      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current = null;
      }
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.reset();
        confettiInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      winAudioRef.current?.pause();
    }
  }, [soundEnabled]);

  const handleSpin = () => {
    if (isSpinning) return;
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
    }
    if (winAudioTimerRef.current !== null) {
      window.clearTimeout(winAudioTimerRef.current);
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nextCount = spinCount + 1;
    const nextReel = buildWeightedReel(nextCount * 13);
    const chosenWinner = nextReel[WINNING_INDEX] ?? DEMO_SKINS[0]!;

    const viewportWidth = viewportRef.current?.clientWidth ?? 900;
    const measuredCardWidth =
      (trackRef.current?.firstElementChild as HTMLElement | null)?.offsetWidth ??
      (viewportWidth < 640 ? 136 : 172);
    const stridePx = measuredCardWidth + CARD_GAP_PX;
    const maxJitter = viewportWidth < 640 ? 18 : 36;
    const jitterPx = Math.round((Math.random() - 0.5) * maxJitter);
    const targetOffset =
      TRACK_PADDING_X +
      WINNING_INDEX * stridePx +
      measuredCardWidth / 2 -
      viewportWidth / 2 +
      jitterPx;

    const durationMs = prefersReducedMotion ? 180 : turboMode ? 1400 : 4200;

    setWinner(null);
    setTransitionMs(0);
    setTranslateX(0);
    setReel(nextReel);
    setSpinCount(nextCount);
    setIsSpinning(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionMs(durationMs);
        setTranslateX(-targetOffset);
      });
    });

    finishTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setWinner(chosenWinner);
      setInspectedId(chosenWinner.id);

      if (!prefersReducedMotion) {
        try {
          const fireConfetti = confettiInstanceRef.current ?? confetti;
          const colors = ["#d946ef", "#e4ae39", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"];

          void fireConfetti({
            particleCount: 150,
            spread: 100,
            origin: { x: 0.5, y: 0.44 },
            startVelocity: 45,
            colors,
          });

          void fireConfetti({
            particleCount: 80,
            spread: 360,
            origin: { x: 0.5, y: 0.44 },
            ticks: 200,
            gravity: 1.2,
            scalar: 1.5,
            shapes: ["square"],
            colors,
          });
        } catch {
          // Ignore canvas confetti errors in unsupported environments
        }
      }

      winAudioTimerRef.current = window.setTimeout(() => {
        if (soundEnabled && winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          void winAudioRef.current.play().catch(() => {});
        }
      }, 180);
    }, durationMs + 60);
  };

  return (
    <section
      id="jabbu-case"
      aria-labelledby="home-roulette-heading"
      className="w-full bg-[#120d1e] px-3 sm:px-8 lg:px-12 py-12 sm:py-20 scroll-mt-20"
    >
      <div className="relative mx-auto max-w-[1440px] flex flex-col gap-5 sm:gap-6 rounded-[4px] bg-[#191527] p-4 sm:p-8 overflow-hidden">
        {/* Confetti / Serpentinas layer */}
        <canvas
          ref={confettiCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 h-full w-full"
        />
        {/* CS2 Weapon Case Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-18 sm:h-16 sm:w-20 shrink-0 items-center justify-center rounded-[4px] bg-[#120d1e] p-1.5">
                <Image
                  src="/category-images/containers-steam.png"
                  alt="CS2 Jabbu Container"
                  width={96}
                  height={74}
                  priority
                  className="h-10 sm:h-12 w-auto object-contain select-none"
                />
                <Image
                  src="/category-images/keys-steam.png"
                  alt="CS2 Case Key"
                  width={42}
                  height={32}
                  className="absolute -bottom-1 -right-1 h-6 sm:h-7 w-auto object-contain select-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:hidden">
                <h2
                  className="font-[family-name:var(--font-unbounded)] text-[1.35rem] font-extrabold leading-[1.08] tracking-[-0.025em] text-white"
                >
                  {t("home.roulette.title")}
                </h2>
                <span className="inline-flex items-center rounded-[4px] bg-[#2f2846] px-2.5 py-1 text-[13px] font-bold text-[#f0abfc]">
                  {t("home.roulette.badge")}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="hidden sm:flex flex-wrap items-center gap-3">
                <h2
                  id="home-roulette-heading"
                  className="font-[family-name:var(--font-unbounded)] text-[clamp(1.45rem,2.6vw,2.35rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white"
                >
                  {t("home.roulette.title")}
                </h2>
                <span className="inline-flex items-center rounded-[4px] bg-[#2f2846] px-3 py-1 text-[13px] font-bold text-[#f0abfc]">
                  {t("home.roulette.badge")}
                </span>
              </div>
              <p className="sm:mt-1.5 text-[14px] sm:text-[15px] leading-[1.5] text-[#c3bdd9] max-w-[60ch]">
                {renderHighlightedSimulation(t("home.roulette.desc"))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTurboMode((prev) => !prev)}
              aria-pressed={turboMode}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 rounded-[4px] px-3.5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef] ${
                turboMode
                  ? "bg-[#2f2846] text-white"
                  : "bg-[#211c33] text-[#c3bdd9] hover:bg-[#2f2846] hover:text-white"
              }`}
            >
              <Zap className={`h-4 w-4 ${turboMode ? "text-[#d946ef]" : ""}`} />
              <span>{t("home.roulette.turbo")}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              aria-label={t("home.roulette.sound")}
              title={t("home.roulette.sound")}
              className={`inline-flex items-center justify-center rounded-[4px] px-3.5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef] ${
                soundEnabled
                  ? "bg-[#2f2846] text-white"
                  : "bg-[#211c33] text-[#c3bdd9] hover:bg-[#2f2846] hover:text-white"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-[#d946ef]" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#d946ef] px-6 py-3.5 sm:py-3 text-[14px] font-bold uppercase tracking-[0.06em] text-[#090612] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
            >
              <KeyRound className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
              <span>
                {isSpinning
                  ? t("home.roulette.spinning")
                  : winner
                    ? t("home.roulette.spinAgain")
                    : t("home.roulette.spin")}
              </span>
            </button>
          </div>
        </div>

        {/* Authentic CS2 Unboxing Track */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden rounded-[4px] bg-[#06040c] py-8"
        >
          {/* Top & Bottom CS2 Gold Notches + Center Needle */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[9px] border-l-transparent border-r-transparent border-t-[#e4ae39]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[2px] -translate-x-1/2 bg-[#e4ae39]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[9px] border-l-transparent border-r-transparent border-b-[#e4ae39]"
          />

          <div
            ref={trackRef}
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transitionProperty: transitionMs > 0 ? "transform" : "none",
              transitionDuration: `${transitionMs}ms`,
              transitionTimingFunction: "cubic-bezier(0.08, 0.85, 0.16, 1)",
            }}
            className="flex items-stretch gap-[10px] px-4 will-change-transform"
          >
            {reel.map((item, idx) => {
              const hasStopped = !isSpinning && winner !== null;
              const isWinningCard = hasStopped && idx === WINNING_INDEX;
              const isLeftCard = hasStopped && idx < WINNING_INDEX;
              const isRightCard = hasStopped && idx > WINNING_INDEX;

              let settleClasses = "scale-100 translate-x-0 opacity-100";
              if (isWinningCard) {
                settleClasses = "scale-[1.12] sm:scale-[1.16] z-20 bg-[#211c33] outline-2";
              } else if (isLeftCard) {
                settleClasses = "-translate-x-3 sm:-translate-x-4 opacity-35 scale-[0.92]";
              } else if (isRightCard) {
                settleClasses = "translate-x-3 sm:translate-x-4 opacity-35 scale-[0.92]";
              }

              return (
                <div
                  key={`${spinCount}-${idx}-${item.id}`}
                  style={{
                    outlineColor: isWinningCard ? item.rarityHex : undefined,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className={`relative w-[136px] sm:w-[172px] shrink-0 rounded-[4px] bg-[#191527] overflow-hidden flex flex-col justify-between transition-[transform,opacity,background-color] duration-500 ${settleClasses}`}
                >
                  <div className="px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-2 flex flex-col justify-between flex-1">
                    <div className="flex items-center justify-center h-[72px] sm:h-[88px]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={136}
                        height={102}
                        className="h-[66px] sm:h-[82px] w-auto object-contain select-none"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-[13px] font-bold text-white truncate">{item.weapon}</p>
                      <p className="text-[13px] font-medium text-[#c3bdd9] truncate">{item.skin}</p>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{ backgroundColor: item.rarityHex }}
                    className="h-1.5 w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Unboxed Item Reveal / Live Inspection Bar */}
        <div className="rounded-[4px] bg-[#120d1e] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {winner ? (
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 home-roulette-pop">
              <div
                style={{ backgroundColor: winner.rarityHex }}
                className="w-1.5 self-stretch rounded-[2px] shrink-0"
                aria-hidden="true"
              />
              <div className="flex h-14 w-18 sm:h-16 sm:w-22 shrink-0 items-center justify-center rounded-[4px] bg-[#090612] p-1.5 sm:p-2">
                <Image
                  src={winner.image}
                  alt={winner.name}
                  width={96}
                  height={72}
                  className="h-11 sm:h-12 w-auto object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  style={{ color: winner.rarityHex }}
                  className="text-[13px] font-bold truncate"
                >
                  {t("home.roulette.winnerLabel")} · {winner.tierLabel}
                </p>
                <p className="mt-0.5 text-base sm:text-lg font-bold text-white truncate">
                  {winner.name}
                </p>
                <p className="text-[13px] sm:text-[14px] text-[#c3bdd9] tabular-nums">
                  Float {winner.floatValue} · USD {winner.priceUsd.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div
                style={{ backgroundColor: inspectedSkin.rarityHex }}
                className="w-1.5 self-stretch rounded-[2px] shrink-0"
                aria-hidden="true"
              />
              <div className="flex h-14 w-18 sm:w-20 shrink-0 items-center justify-center rounded-[4px] bg-[#090612] p-1.5">
                <Image
                  src={inspectedSkin.image}
                  alt={inspectedSkin.name}
                  width={88}
                  height={66}
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-white truncate">{inspectedSkin.name}</p>
                <p className="text-[13px] font-medium text-[#c3bdd9] tabular-nums">
                  {inspectedSkin.tierLabel} · Float {inspectedSkin.floatValue} · USD{" "}
                  {inspectedSkin.priceUsd.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 shrink-0">
            <span className="rounded-[4px] bg-[#191527] px-3.5 py-2 text-[13px] font-medium text-[#e4def7]">
              {renderHighlightedSimulation(t("home.roulette.demoNote"))}
            </span>
            <Link
              href={localizePath("/raffles")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#211c33] px-5 py-3 text-[14px] font-bold text-white hover:bg-[#2f2846] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
            >
              <span>{t("home.roulette.goRaffles")}</span>
              <ArrowRight className="h-4 w-4 text-[#d946ef]" />
            </Link>
          </div>
        </div>

        {/* CS2 Container Contents Showcase */}
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-semibold text-[#c3bdd9]">
            {t("home.roulette.poolLabel")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {DEMO_SKINS.map((skin) => {
              const selected = skin.id === inspectedId;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => setInspectedId(skin.id)}
                  className={`rounded-[4px] overflow-hidden text-left transition-[background-color,transform] duration-150 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef] ${
                    selected ? "bg-[#211c33]" : "bg-[#120d1e] hover:bg-[#211c33]"
                  }`}
                >
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-center h-[74px] sm:h-[88px]">
                      <Image
                        src={skin.image}
                        alt={skin.name}
                        width={136}
                        height={102}
                        className="h-[68px] sm:h-[82px] w-auto object-contain"
                      />
                    </div>
                    <p className="mt-2 text-[13px] font-bold text-white truncate">{skin.weapon}</p>
                    <p className="text-[13px] font-medium text-[#c3bdd9] truncate">{skin.skin}</p>
                    <p className="mt-0.5 text-[13px] font-bold text-[#f0abfc] tabular-nums">
                      USD {skin.priceUsd.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{ backgroundColor: skin.rarityHex }}
                    className="h-1 w-full"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
