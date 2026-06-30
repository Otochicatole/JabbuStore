"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/shared/components/Button";
import {
  ArrowRight,
  ShoppingBag,
  DollarSign,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle,
  CreditCard,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

const stats = [
  { labelKey: "home.stats.activeUsers", value: "150K+" },
  { labelKey: "home.stats.availableSkins", value: "45K+" },
  { labelKey: "home.stats.transactions", value: "2.5M+" },
  { labelKey: "home.stats.onlineSupport", value: "24/7" },
];

export default function Home() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  const scrollToContent = () => {
    const nextSection = document.getElementById("stats-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0712] overflow-x-hidden text-white flex flex-col pt-16 font-sans selection:bg-accent selection:text-white">
      {/* Tech Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Cyberpunk Accent Lights (Neon Glows) */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/15 blur-[160px] pointer-events-none animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[700px] h-[700px] rounded-full bg-fuchsia-600/5 blur-[180px] pointer-events-none" />

      {/* --- SECTION 1: HERO (min-h-[90vh]) --- */}
      <section className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 md:py-20 min-h-[100vh]">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col text-center lg:text-left items-center lg:items-start">
            {/* Header Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2.5 border border-accent/40 bg-accent/10 px-4.5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-accent shadow-[0_0_20px_rgba(217,70,239,0.25)] backdrop-blur-md">
                <span className="inline-block w-2 h-2 bg-accent rounded-full animate-ping" />
                {t("home.badge")}
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.95] text-white">
              {t("home.hero.title")}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-fuchsia-500 to-purple-400 drop-shadow-[0_2px_25px_rgba(217,70,239,0.35)] font-extrabold">
                {t("home.hero.highlight")}
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-white/60 text-base md:text-lg font-medium leading-relaxed">
              {t("home.hero.description")}
            </p>

            {/* Unified CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href={localizePath("/buy")} className="w-full sm:w-auto">
                <Button className="w-full sm:w-60 h-14 bg-gradient-to-r from-accent to-fuchsia-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 border-none">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  {t("home.buy.cta")}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              </Link>
              <Link href={localizePath("/sell")} className="w-full sm:w-auto">
                <Button className="w-full sm:w-60 h-14 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-widest text-xs rounded-xl border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent shrink-0" />
                  {t("home.sell.cta")}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Skin Mockup Display Column */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent/20 to-purple-500/20 rounded-3xl blur-3xl opacity-50 pointer-events-none animate-pulse" />

            {/* Visual Glassmorphism Card */}
            <div className="relative w-full max-w-[380px] bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_70px_rgba(217,70,239,0.15)] transition-all duration-700 group hover:-translate-y-2">
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#eb4b4b]/10 border border-[#eb4b4b]/30 text-[#eb4b4b] px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                ★ Rare Special Item
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-black text-accent tracking-widest font-mono uppercase">
                  ★ Butterfly Knife
                </span>
                <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                   Doppler Phase 2
                </h3>
                <span className="text-[9px] font-bold text-white/40 uppercase font-mono mt-0.5">
                  Factory New
                </span>
              </div>

              {/* Central Floating Knife Asset */}
              <div className="relative h-[220px] w-full my-4 flex items-center justify-center">
                <Image
                  src="/category-images/knives.webp"
                  alt="Legendary Neon Karambit CS2 Skin"
                  width={280}
                  height={220}
                  priority
                  className="object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.85)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-700"
                />
              </div>

              {/* Technical Spec Panel inside Card */}
              <div className="bg-black/45 border border-white/5 rounded-xl p-4 flex flex-col gap-2 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#84849b]">Float Value:</span>
                  <span className="text-green-400 font-bold">0.00318920</span>
                </div>
                {/* Micro Progress Bar */}
                <div className="h-1 w-full bg-[#151322] rounded-full overflow-hidden relative border border-white/5">
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                    style={{ width: "12%" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] mt-1">
                  <span className="text-[#84849b]">Paint Seed:</span>
                  <span className="text-white font-bold">389</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="mt-16 self-center animate-bounce cursor-pointer flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors"
          onClick={scrollToContent}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.25em]">
            Scroll Down
          </span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* --- SECTION 2: STATS ROW --- */}
      <section
        id="stats-section"
        className="relative z-10 border-y border-white/5 bg-black/35 py-12 backdrop-blur-md scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div
              key={s.labelKey}
              className="border-l-2 border-accent pl-6 flex flex-col justify-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-[0_2px_15px_rgba(217,70,239,0.15)]">
                {s.value}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1.5">
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: FEATURES GRID (~60vh) --- */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            {t("home.feature.section.title")}
          </h2>
          <p className="text-white/50 text-sm md:text-base mt-4">
            {t("home.feature.section.desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Security */}
          <div className="bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 shadow-lg group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-300" />
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
                {t("home.feature.secure.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                {t("home.feature.secure.description")}
              </p>
            </div>
          </div>

          {/* Card 2: Payouts */}
          <div className="bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 shadow-lg group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl group-hover:bg-fuchsia-500/10 transition-all duration-300" />
            <div className="w-12 h-12 bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
                {t("home.feature.fast.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                {t("home.feature.fast.description")}
              </p>
            </div>
          </div>

          {/* Card 3: Live Market */}
          <div className="bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 shadow-lg group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300" />
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
                {t("home.feature.market.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                {t("home.feature.market.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: HOW IT WORKS timeline (~50vh) --- */}
      <section className="relative z-10 border-t border-white/5 bg-black/15 py-24">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
              {t("home.howitworks.title")}
            </h2>
            <p className="text-white/50 text-sm md:text-base mt-4">
              {t("home.howitworks.section.desc")}
            </p>
          </div>

          {/* Responsive Timeline Grid */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for Desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-accent/20 via-fuchsia-500/40 to-accent/20 z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-16 h-16 bg-[#0a0712] border-2 border-accent/40 rounded-full flex items-center justify-center font-mono font-bold text-lg mb-6 shadow-[0_0_20px_rgba(217,70,239,0.1)] group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
                {t("home.howitworks.step1.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step1.desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-16 h-16 bg-[#0a0712] border-2 border-fuchsia-500/40 rounded-full flex items-center justify-center font-mono font-bold text-lg mb-6 shadow-[0_0_20px_rgba(217,70,239,0.1)] group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all">
                <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
                {t("home.howitworks.step2.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step2.desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-16 h-16 bg-[#0a0712] border-2 border-purple-500/40 rounded-full flex items-center justify-center font-mono font-bold text-lg mb-6 shadow-[0_0_20px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
                {t("home.howitworks.step3.title")}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step3.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 6: FINAL CTA BANNER (~30vh) --- */}
      <section className="relative z-10 border-t border-white/5 bg-gradient-to-b from-black/25 to-[#050308] py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-3xl p-12 md:p-16 shadow-[0_0_50px_rgba(217,70,239,0.05)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
              {t("home.cta.title")}
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-white/50 text-sm md:text-base leading-relaxed">
              {t("home.cta.desc")}
            </p>

            <div className="mt-8 flex justify-center">
              <Link href={localizePath("/buy")}>
                <Button className="h-14 px-10 bg-accent text-white hover:bg-white hover:text-accent font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all duration-300">
                  {t("home.cta.button")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050308] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-accent to-fuchsia-600 flex items-center justify-center font-black text-white text-xs rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.2)]">
              JS
            </div>
            <span className="text-sm font-black uppercase tracking-widest">
              Jabbu<span className="text-accent">Store</span>
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 text-center md:text-right max-w-md leading-relaxed">
            {t("home.footer.disclaimer")}
          </div>
        </div>
      </footer>
    </div>
  );
}
