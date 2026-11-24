"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { HeroGlitchBlock } from "@/features/home/ui/HeroGlitchBlock";
import { HomeRouletteSection } from "@/features/home/ui/HomeRouletteSection";
import { HomeReviewsSection } from "@/features/reviews/ui/HomeReviewsSection";
import { HomeSponsorsSection } from "@/features/sponsors/ui/HomeSponsorsSection";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { isJabbuMarketEnabled } from "@/shared/lib/features";

const INITIAL_STATS = [
  { labelKey: "home.stats.activeUsers", value: "150K+" },
  { labelKey: "home.stats.availableSkins", value: "45K+" },
  { labelKey: "home.stats.transactions", value: "2.5M+" },
  { labelKey: "home.stats.onlineSupport", value: "24/7" },
];

function stripStepPrefix(title: string): string {
  return title.replace(/^\d+\.\s*/, "").trim();
}

export default function Home() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [stats, setStats] = useState(INITIAL_STATS);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${BACKEND_URL}/marketplace/settings/public`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.homeStatsActiveUsers) {
          setStats([
            { labelKey: "home.stats.activeUsers", value: data.homeStatsActiveUsers },
            { labelKey: "home.stats.availableSkins", value: data.homeStatsAvailableSkins },
            { labelKey: "home.stats.transactions", value: data.homeStatsTransactions },
            { labelKey: "home.stats.onlineSupport", value: data.homeStatsOnlineSupport },
          ]);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching public stats:", err);
      });

    return () => controller.abort();
  }, []);

  const buyPath = localizePath(isJabbuMarketEnabled() ? "/buy" : "/market");
  const sellPath = localizePath("/sell");

  const features = [
    {
      title: t("home.feature.secure.title"),
      description: t("home.feature.secure.description"),
      markerClass: "bg-[#d946ef]",
    },
    {
      title: t("home.feature.fast.title"),
      description: t("home.feature.fast.description"),
      markerClass: "bg-[#f0abfc]",
    },
    {
      title: t("home.feature.market.title"),
      description: t("home.feature.market.description"),
      markerClass: "bg-[#e879f9]",
    },
  ];

  const steps = [
    {
      title: stripStepPrefix(t("home.howitworks.step1.title")),
      description: t("home.howitworks.step1.desc"),
      surfaceClass: "bg-[#120d1e]",
    },
    {
      title: stripStepPrefix(t("home.howitworks.step2.title")),
      description: t("home.howitworks.step2.desc"),
      surfaceClass: "bg-[#191527]",
    },
    {
      title: stripStepPrefix(t("home.howitworks.step3.title")),
      description: t("home.howitworks.step3.desc"),
      surfaceClass: "bg-[#211c33]",
    },
  ];

  return (
    <main className="w-full min-h-dvh bg-[#090612] text-white pt-16 overflow-x-clip">
      {/* SECTION 1: HERO — Cyber pattern backdrop + CanvasUI Glitch headline */}
      <section className="relative w-full bg-[#050505] px-5 sm:px-8 lg:px-12 py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div aria-hidden="true" className="cyber-pattern pointer-events-none absolute inset-0" />

        <div className="relative z-20 mx-auto max-w-[1440px]">
          <HeroGlitchBlock
            subtitle={`${t("home.hero.title")} ${t("home.hero.highlight")}`}
            description={t("home.hero.description")}
            buyHref={buyPath}
            buyLabel={t("home.buy.cta")}
            sellHref={sellPath}
            sellLabel={t("home.sell.cta")}
          />
        </div>
      </section>

      {/* SECTION 2: CS2 CASE ROULETTE — Directly below Hero */}
      <HomeRouletteSection />

      {/* SECTION 3: STATS BAND — Preserving 150K+, 45K+, 2.5M+, 24/7 */}
      <section
        id="stats-section"
        aria-label="Platform metrics"
        className="w-full bg-[#191527] px-5 sm:px-8 lg:px-12 py-16 sm:py-20 scroll-mt-16"
      >
        <div className="mx-auto max-w-[1440px] grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="flex flex-col items-start text-left home-scroll-settle">
              <div className="font-[family-name:var(--font-unbounded)] text-[clamp(2rem,4vw,3.5rem)] font-black leading-none tracking-[-0.03em] text-white tabular-nums">
                {stat.value}
              </div>
              <div className="mt-3 text-[14px] sm:text-[15px] font-semibold text-[#f0abfc]">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: FEATURES — Asymmetric Split + Studio HD Visual */}
      <section className="w-full bg-[#211c33] px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] grid gap-12 lg:grid-cols-12 lg:gap-14 items-center home-scroll-settle">
          <div className="group lg:col-span-6 relative aspect-[16/10] w-full rounded-[4px] bg-[#030108] overflow-hidden">
            <Image
              src="/home/features-showcase-hd.jpg"
              alt="CS2 Tactical Gloves and Sniper Scope Studio Showcase"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <h2 className="font-[family-name:var(--font-unbounded)] text-[clamp(1.75rem,3.4vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white text-balance max-w-[18ch]">
              {t("home.feature.section.title")}
            </h2>
            <p className="mt-4 text-base sm:text-[17px] leading-[1.6] text-[#c3bdd9] max-w-[52ch]">
              {t("home.feature.section.desc")}
            </p>

            <div className="mt-10 flex flex-col gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 home-scroll-settle">
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-[2px] ${feature.markerClass}`}
                  />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-base leading-[1.6] text-[#c3bdd9] max-w-[56ch]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: HOW IT WORKS — Sticky Intro + Sequential Stages */}
      <section className="w-full bg-[#090612] px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] grid gap-12 lg:grid-cols-12 lg:gap-14 items-start home-scroll-settle">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <h2 className="font-[family-name:var(--font-unbounded)] text-[clamp(1.75rem,3.4vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white text-balance">
              {t("home.howitworks.title")}
            </h2>
            <p className="mt-4 text-base sm:text-[17px] leading-[1.6] text-[#c3bdd9] max-w-[40ch]">
              {t("home.howitworks.section.desc")}
            </p>

            <div className="mt-10 hidden lg:flex items-center justify-start overflow-hidden">
              <Image
                src="/category-images/pistols-steam.png"
                alt="CS2 pistol skin"
                width={420}
                height={315}
                loading="lazy"
                className="w-[82%] max-w-[380px] h-auto object-contain select-none"
              />
            </div>
          </div>

          <ol className="lg:col-span-7 flex flex-col gap-4">
            {steps.map((step) => (
              <li
                key={step.title}
                className={`rounded-[4px] p-7 sm:p-10 ${step.surfaceClass} transition-transform duration-200 hover:translate-x-1 home-scroll-settle`}
              >
                <h3 className="font-[family-name:var(--font-unbounded)] text-xl sm:text-2xl font-bold text-white leading-[1.15]">
                  {step.title}
                </h3>
                <p className="mt-3 text-base sm:text-[17px] leading-[1.6] text-[#c3bdd9] max-w-[54ch]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 5: SPONSORS */}
      <HomeSponsorsSection />

      {/* SECTION 6: OPINIONES DE LA COMUNIDAD — Preserving Screenshot 1 Data */}
      <HomeReviewsSection />

      {/* SECTION 7: CLOSING CTA — Cropped Object Returns */}
      <section className="relative w-full bg-[#090612] px-5 sm:px-8 lg:px-12 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-[1440px] grid gap-10 lg:grid-cols-12 items-center home-scroll-settle">
          <div className="lg:col-span-7 relative z-10 flex flex-col items-start text-left">
            <h2 className="font-[family-name:var(--font-unbounded)] text-[clamp(1.35rem,3.2vw,2.9rem)] font-black leading-[1.06] tracking-[-0.025em] text-white max-w-[24ch]">
              {t("home.cta.title")}
            </h2>
            <p className="mt-5 text-base sm:text-[18px] leading-[1.6] text-[#c3bdd9] max-w-[44ch]">
              {t("home.cta.desc")}
            </p>
            <Link
              href={buyPath}
              className="mt-9 inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-[4px] bg-[#d946ef] px-8 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-[#090612] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
            >
              <span>{t("home.cta.button")}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <Image
              src="/category-images/snipers-steam.png"
              alt="CS2 AWP Medusa Sniper Skin Showcase"
              width={512}
              height={384}
              loading="lazy"
              className="w-full max-w-[480px] h-auto object-contain select-none transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#06040c] px-5 sm:px-8 lg:px-12 py-12">
        <div className="mx-auto max-w-[1440px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3.5">
            <Image
              src="/logo.webp"
              alt="JabbuStore Logo"
              width={38}
              height={38}
              className="object-contain rounded-[4px]"
            />
            <span className="font-[family-name:var(--font-unbounded)] text-lg font-extrabold tracking-tight text-white">
              Jabbu<span className="text-[#d946ef]">Store</span>
            </span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 text-[14px] font-semibold text-[#c3bdd9]">
            <Link href={buyPath} className="hover:text-white transition-colors">
              {t("nav.market")}
            </Link>
            <Link href={sellPath} className="hover:text-white transition-colors">
              {t("nav.sell")}
            </Link>
            <Link href={localizePath("/raffles")} className="hover:text-white transition-colors">
              {t("nav.raffles")}
            </Link>
          </nav>

          <p className="text-[13px] font-medium text-[#9891b3] leading-relaxed max-w-md md:text-right">
            {t("home.footer.disclaimer")}
          </p>
        </div>
      </footer>
    </main>
  );
}
