"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Glitch } from "@/components/canvasui/Glitch";
import { supportsHtmlInCanvas } from "@/components/canvasui/GlitchVanilla";

interface HeroGlitchBlockProps {
  subtitle: string;
  description: string;
  buyHref: string;
  buyLabel: string;
  sellHref: string;
  sellLabel: string;
}

const BRAND_LETTERS = [
  { char: "J", isStore: false },
  { char: "a", isStore: false },
  { char: "b", isStore: false },
  { char: "b", isStore: false },
  { char: "u", isStore: false },
  { char: "S", isStore: true },
  { char: "t", isStore: true },
  { char: "o", isStore: true },
  { char: "r", isStore: true },
  { char: "e", isStore: true },
] as const;

const emptySubscribe = () => () => {};

function AnimatedBrandWord({
  forceColor,
}: {
  forceColor?: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline justify-center">
      {BRAND_LETTERS.map((item, idx) => (
        <span
          key={idx}
          style={forceColor ? { color: forceColor } : undefined}
          className={`inline-block will-change-transform transition-transform duration-150 hover:-translate-y-2 hover:scale-110 jabbu-letter-${idx} ${
            forceColor ? "" : item.isStore ? "text-[#d946ef]" : "text-white"
          }`}
        >
          {item.char}
        </span>
      ))}
    </span>
  );
}

export function HeroGlitchBlock({
  subtitle,
  description,
  buyHref,
  buyLabel,
  sellHref,
  sellLabel,
}: HeroGlitchBlockProps) {
  const nativeHtmlInCanvas = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );

  return (
    <Glitch
      className="w-full max-w-[1100px] mx-auto"
      intensity={0.95}
      interval={3}
      duration={0.45}
      shift={30}
      rgbShift={5}
      blocks={0.5}
      noise={0.35}
      slices={24}
    >
      <div
        className={`flex flex-col items-center text-center py-4 px-2 ${
          !nativeHtmlInCanvas ? "hero-glitch-base" : ""
        }`}
      >
        <div className="relative inline-block py-2">
          <h1
            aria-label="JabbuStore"
            className="font-[family-name:var(--font-unbounded)] text-[clamp(2.6rem,7.2vw,6rem)] font-black leading-[1.04] tracking-[-0.03em]"
          >
            <AnimatedBrandWord />
          </h1>

          {!nativeHtmlInCanvas && (
            <>
              <span
                aria-hidden="true"
                className="hero-glitch-layer-cyan pointer-events-none select-none absolute inset-0 py-2 font-[family-name:var(--font-unbounded)] text-[clamp(2.6rem,7.2vw,6rem)] font-black leading-[1.04] tracking-[-0.03em]"
              >
                <AnimatedBrandWord forceColor="#03e9f4" />
              </span>

              <span
                aria-hidden="true"
                className="hero-glitch-layer-magenta pointer-events-none select-none absolute inset-0 py-2 font-[family-name:var(--font-unbounded)] text-[clamp(2.6rem,7.2vw,6rem)] font-black leading-[1.04] tracking-[-0.03em]"
              >
                <AnimatedBrandWord forceColor="#d946ef" />
              </span>
            </>
          )}
        </div>

        <p className="mt-4 font-[family-name:var(--font-unbounded)] text-[clamp(1.05rem,2vw,1.65rem)] font-bold uppercase tracking-[-0.01em] text-[#f0abfc]">
          {subtitle}
        </p>

        <p className="mt-4 text-base sm:text-[18px] leading-[1.6] text-[#d5d0eb] max-w-[50ch]">
          {description}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href={buyHref}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-[4px] bg-[#d946ef] px-8 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-[#090612] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
          >
            <span>{buyLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>

          <Link
            href={sellHref}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-[4px] bg-[#211c33] px-8 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-white transition-[background-color,transform] duration-150 hover:bg-[#2f2846] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
          >
            {sellLabel}
          </Link>
        </div>
      </div>
    </Glitch>
  );
}
