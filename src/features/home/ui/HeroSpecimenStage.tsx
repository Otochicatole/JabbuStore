"use client";

import { useEffect, useState, useSyncExternalStore, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { isJabbuMarketEnabled } from "@/shared/lib/features";

interface SpecimenItem {
  id: string;
  labelKey: string;
  skinName: string;
  rarityLabel: string;
  image: string;
  alt: string;
  category: string;
  basePriceUsd: number;
  accentHex: string;
}

interface WearPreset {
  code: "FN" | "MW" | "FT";
  floatValue: string;
  markerPercent: number;
  priceMultiplier: number;
}

const WEAR_PRESETS: WearPreset[] = [
  { code: "FN", floatValue: "0.0142", markerPercent: 12, priceMultiplier: 1.0 },
  { code: "MW", floatValue: "0.0894", markerPercent: 32, priceMultiplier: 0.84 },
  { code: "FT", floatValue: "0.1946", markerPercent: 58, priceMultiplier: 0.68 },
];

const SPECIMENS: SpecimenItem[] = [
  {
    id: "knives",
    labelKey: "home.showcase.knives",
    skinName: "Butterfly Knife | Doppler Phase 2",
    rarityLabel: "Covert Knife",
    image: "/home/hero-butterfly-hd.jpg",
    alt: "CS2 Butterfly Knife Doppler Phase 2 HD render",
    category: "knives",
    basePriceUsd: 3890,
    accentHex: "#d946ef",
  },
  {
    id: "rifles",
    labelKey: "home.showcase.rifles",
    skinName: "M4A4 | Howl",
    rarityLabel: "Contraband",
    image: "/home/hero-rifle-hd.jpg",
    alt: "CS2 M4A4 Howl HD render",
    category: "rifles",
    basePriceUsd: 4650,
    accentHex: "#eb4b4b",
  },
  {
    id: "gloves",
    labelKey: "home.showcase.gloves",
    skinName: "Sport Gloves | Pandora's Box",
    rarityLabel: "Extraordinary",
    image: "/home/hero-gloves-hd.jpg",
    alt: "CS2 Sport Gloves Pandora's Box HD render",
    category: "gloves",
    basePriceUsd: 5420,
    accentHex: "#e4ae39",
  },
  {
    id: "snipers",
    labelKey: "home.showcase.snipers",
    skinName: "AWP | Medusa",
    rarityLabel: "Covert",
    image: "/home/hero-sniper-hd.jpg",
    alt: "CS2 AWP Medusa HD render",
    category: "snipers",
    basePriceUsd: 2980,
    accentHex: "#38bdf8",
  },
];

const ROTATION_INTERVAL_MS = 5500;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroSpecimenStage() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [activeIndex, setActiveIndex] = useState(0);
  const [wearIndex, setWearIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  useEffect(() => {
    if (isPaused || reducedMotion || typeof window === "undefined") return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((prev) => (prev + 1) % SPECIMENS.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, reducedMotion]);

  const active = SPECIMENS[activeIndex] ?? SPECIMENS[0]!;
  const wear = WEAR_PRESETS[wearIndex] ?? WEAR_PRESETS[0]!;
  const estimatedPrice = Math.round(active.basePriceUsd * wear.priceMultiplier);
  const marketBasePath = isJabbuMarketEnabled() ? "/buy" : "/market";

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const normX = (event.clientX - rect.left) / rect.width - 0.5;
    const normY = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Number((-normY * 7).toFixed(2)),
      y: Number((normX * 9).toFixed(2)),
    });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="relative flex flex-col bg-[#120d1e] rounded-[4px] overflow-hidden">
      {/* Full-bleed HD studio render with 3D pointer parallax */}
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className="relative h-[300px] sm:h-[370px] lg:h-[420px] w-full overflow-hidden bg-[#06040c] select-none"
      >
        {SPECIMENS.map((item, idx) => {
          const isCurrent = idx === activeIndex;
          const tiltStyle = isCurrent
            ? {
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
                  tilt.x !== 0 || tilt.y !== 0 ? 1.04 : 1.01
                })`,
                transitionTimingFunction: "var(--ease-soft)",
              }
            : {
                transform: "perspective(1000px) scale(0.97)",
                transitionTimingFunction: "var(--ease-soft)",
              };

          return (
            <div
              key={item.id}
              aria-hidden={!isCurrent}
              style={tiltStyle}
              className={`absolute inset-0 transition-[opacity,transform] duration-500 ${
                isCurrent ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}

        {/* Rarity corner indicator pill */}
        <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 rounded-[4px] bg-[#191527] px-3 py-1.5">
          <span
            aria-hidden="true"
            style={{ backgroundColor: active.accentHex }}
            className="h-2.5 w-2.5 rounded-[2px] shrink-0"
          />
          <span className="text-[13px] font-semibold text-white">{active.rarityLabel}</span>
        </div>

        {/* Pause / Play control for WCAG 2.2.2 compliance */}
        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          aria-label={isPaused ? t("home.showcase.play") : t("home.showcase.pause")}
          title={isPaused ? t("home.showcase.play") : t("home.showcase.pause")}
          className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-[4px] bg-[#191527] text-[#c3bdd9] hover:bg-[#2f2846] hover:text-white transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        {/* Bottom rarity accent bar synced with active weapon */}
        <div
          aria-hidden="true"
          style={{ backgroundColor: active.accentHex }}
          className="absolute inset-x-0 bottom-0 z-10 h-[3px] transition-colors duration-300"
        />
      </div>

      {/* Category switcher, live float bar, and specimen link */}
      <div className="bg-[#191527] px-5 py-4 sm:px-6 sm:py-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-[15px] sm:text-base font-bold text-white tracking-tight">
              {active.skinName}
            </p>
            <span className="text-[14px] font-bold text-[#f0abfc] tabular-nums">
              USD {estimatedPrice.toLocaleString("en-US")}
            </span>
          </div>

          <Link
            href={`${localizePath(marketBasePath)}?category=${encodeURIComponent(active.category)}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#d946ef] hover:underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
          >
            <span>{t("home.showcase.viewCategory")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Interactive Wear / Float bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#120d1e] rounded-[4px] px-3.5 py-2.5">
          <div className="flex items-center gap-3 min-w-[180px] flex-1">
            <span className="text-[13px] font-medium text-[#b7b1ce]">
              {t("home.showcase.wear")}
            </span>
            <div className="relative h-2 flex-1 rounded-full bg-[#211c33] overflow-hidden">
              <div
                style={{ width: `${wear.markerPercent}%`, backgroundColor: active.accentHex }}
                className="h-full transition-[width,background-color] duration-300"
              />
            </div>
            <span className="text-[13px] font-semibold text-white tabular-nums">
              {wear.floatValue}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {WEAR_PRESETS.map((preset, idx) => {
              const isSelected = idx === wearIndex;
              return (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => setWearIndex(idx)}
                  className={`px-2.5 py-1 rounded-[4px] text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef] ${
                    isSelected
                      ? "bg-[#d946ef] text-[#090612] font-bold"
                      : "bg-[#211c33] text-[#c3bdd9] hover:bg-[#2f2846] hover:text-white"
                  }`}
                >
                  {preset.code}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="CS2 skin categories">
          {SPECIMENS.map((item, idx) => {
            const selected = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActiveIndex(idx);
                  setIsPaused(true);
                }}
                className={`px-3.5 py-2 rounded-[4px] text-[13px] font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef] ${
                  selected
                    ? "bg-[#d946ef] text-[#090612] font-bold"
                    : "bg-[#211c33] text-[#c3bdd9] hover:bg-[#2f2846] hover:text-white"
                }`}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
