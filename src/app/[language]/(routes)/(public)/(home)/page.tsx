"use client";

import { useState, useEffect } from "react";
import { BACKEND_URL } from "@/shared/lib/api";
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
  Lock,
  Sparkles,
} from "lucide-react";
import { HomeReviewsSection } from "@/features/reviews/ui/HomeReviewsSection";
import { HomeSponsorsSection } from "@/features/sponsors/ui/HomeSponsorsSection";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { motion, useScroll, useTransform } from "framer-motion";

const initialStats = [
  { labelKey: "home.stats.activeUsers", value: "150K+" },
  { labelKey: "home.stats.availableSkins", value: "45K+" },
  { labelKey: "home.stats.transactions", value: "2.5M+" },
  { labelKey: "home.stats.onlineSupport", value: "24/7" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Home() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    fetch(`${BACKEND_URL}/marketplace/settings/public`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.homeStatsActiveUsers) {
          setStats([
            { labelKey: "home.stats.activeUsers", value: data.homeStatsActiveUsers },
            { labelKey: "home.stats.availableSkins", value: data.homeStatsAvailableSkins },
            { labelKey: "home.stats.transactions", value: data.homeStatsTransactions },
            { labelKey: "home.stats.onlineSupport", value: data.homeStatsOnlineSupport },
          ]);
        }
      })
      .catch((err) => console.error("Error fetching public stats:", err));
  }, []);

  const scrollToContent = () => {
    const nextSection = document.getElementById("stats-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030108] overflow-hidden text-white flex flex-col pt-16 font-sans selection:bg-accent selection:text-white">
      {/* Animated Tech Grid Overlay */}
      <motion.div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          y
        }}
      />

      {/* Cyberpunk Accent Lights (Neon Glows) */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-accent/20 blur-[200px] pointer-events-none animate-pulse mix-blend-screen" style={{ animationDuration: "10s" }} />
      <div className="absolute top-[20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[180px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[10%] left-[-10%] w-[900px] h-[900px] rounded-full bg-fuchsia-600/10 blur-[250px] pointer-events-none mix-blend-screen" />

      {/* --- SECTION 1: HERO --- */}
      <section className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 md:py-20 min-h-[90vh]">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-7 flex flex-col text-center lg:text-left items-center lg:items-start"
          >
            {/* Header Badge */}
            <motion.div variants={fadeIn} className="mb-8 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-blue-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative inline-flex items-center gap-2.5 border border-white/10 bg-black/50 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white backdrop-blur-xl">
                <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400">
                  {t("home.badge")}
                </span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.95] text-white">
              {t("home.hero.title")}
              <br />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-2 bg-accent/20 blur-2xl rounded-full"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-accent via-fuchsia-400 to-blue-500 font-extrabold drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                  {t("home.hero.highlight")}
                </span>
              </span>
            </motion.h1>

            <motion.p variants={fadeIn} className="mt-8 max-w-xl text-white/70 text-base md:text-lg font-medium leading-relaxed backdrop-blur-sm">
              {t("home.hero.description")}
            </motion.p>

            {/* Unified CTA Buttons */}
            <motion.div variants={fadeIn} className="mt-12 flex flex-col sm:flex-row gap-5 w-full sm:w-auto relative z-20">
              <Link href={localizePath("/buy")} className="w-full sm:w-auto group">
                <Button className="w-full sm:w-64 h-16 bg-gradient-to-r from-accent to-fuchsia-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_50px_rgba(217,70,239,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"></div>
                  <ShoppingBag className="w-5 h-5 shrink-0 relative z-10" />
                  <span className="relative z-10">{t("home.buy.cta")}</span>
                  <ArrowRight className="w-5 h-5 shrink-0 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={localizePath("/sell")} className="w-full sm:w-auto group">
                <Button className="w-full sm:w-64 h-16 bg-white/[0.03] text-white hover:bg-white/10 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-3">
                  <DollarSign className="w-5 h-5 text-accent shrink-0" />
                  {t("home.sell.cta")}
                  <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Skin Mockup Display Column */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="lg:col-span-5 flex justify-center items-center relative perspective-[1000px]"
          >
            <div className="absolute -inset-10 bg-gradient-to-tr from-accent/30 via-purple-500/20 to-blue-500/30 rounded-[3rem] blur-3xl opacity-60 pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />

            {/* Visual Glassmorphism Card */}
            <motion.div 
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative w-full max-w-[340px] bg-black/50 border border-white/10 rounded-3xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] group transition-all duration-500 mx-auto"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>
              
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-[#eb4b4b]/20 to-transparent border border-[#eb4b4b]/40 text-[#eb4b4b] px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(235,75,75,0.3)]">
                <span className="w-1 h-1 rounded-full bg-[#eb4b4b] animate-ping"></span>
                Legendary
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-black text-accent tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                  ★ Butterfly Knife
                </span>
                <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                   Doppler Phase 2
                </h3>
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">
                  Factory New
                </span>
              </div>

              {/* Central Floating Knife Asset */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-[180px] w-full my-4 flex items-center justify-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]"
              >
                <div className="absolute inset-0 bg-accent/30 blur-[60px] rounded-full scale-50 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 ease-in-out"></div>
                <Image
                  src="/category-images/knives.webp"
                  alt="Legendary Neon Karambit CS2 Skin"
                  width={240}
                  height={180}
                  priority
                  className="object-contain relative z-10 group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-700 ease-out"
                />
              </motion.div>

              {/* Technical Spec Panel inside Card */}
              <div className="bg-[#050308]/80 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/40 uppercase tracking-wider">Float Value</span>
                  <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">0.00318920</span>
                </div>
                {/* Micro Progress Bar */}
                <div className="h-1 w-full bg-black rounded-full overflow-hidden relative border border-white/10 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "12%" }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono mt-0.5">
                  <span className="text-white/40 uppercase tracking-wider">Pattern Template</span>
                  <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">389</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>


      </section>

      {/* --- SECTION 2: STATS ROW --- */}
      <section
        id="stats-section"
        className="relative z-10 border-y border-white/5 bg-white/[0.01] backdrop-blur-2xl py-16 scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto w-full px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-10"
          >
            {stats.map((s) => (
              <motion.div
                key={s.labelKey}
                variants={fadeIn}
                className="relative group flex flex-col items-center text-center"
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                  {s.value}
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-accent/80 mt-3 flex items-center justify-center gap-2">
                  <span className="w-4 h-[1px] bg-accent/50"></span>
                  {t(s.labelKey)}
                  <span className="w-4 h-[1px] bg-accent/50"></span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 3: FEATURES GRID --- */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-[1px] bg-accent"></span>
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">Why Choose Us</span>
            <span className="w-8 h-[1px] bg-accent"></span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">
            {t("home.feature.section.title")}
          </h2>
          <p className="text-white/50 text-base md:text-lg leading-relaxed">
            {t("home.feature.section.desc")}
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Card 1: Security */}
          <motion.div variants={fadeIn} className="bg-white/5 border border-white/5 hover:border-accent/40 rounded-3xl p-6 sm:p-10 flex flex-col gap-8 transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 group-hover:scale-150 transition-all duration-700" />
            <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 flex items-center justify-center text-accent rounded-2xl shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all duration-300">
              <Shield className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-wide text-white mb-4">
                {t("home.feature.secure.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {t("home.feature.secure.description")}
              </p>
            </div>
          </motion.div>

          {/* Card 2: Payouts */}
          <motion.div variants={fadeIn} className="bg-white/5 border border-white/5 hover:border-fuchsia-500/40 rounded-3xl p-6 sm:p-10 flex flex-col gap-8 transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 group-hover:scale-150 transition-all duration-700" />
            <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500/20 to-transparent border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 rounded-2xl shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all duration-300">
              <Zap className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-wide text-white mb-4">
                {t("home.feature.fast.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {t("home.feature.fast.description")}
              </p>
            </div>
          </motion.div>

          {/* Card 3: Live Market */}
          <motion.div variants={fadeIn} className="bg-white/5 border border-white/5 hover:border-blue-500/40 rounded-3xl p-6 sm:p-10 flex flex-col gap-8 transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 group-hover:scale-150 transition-all duration-700" />
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 flex items-center justify-center text-blue-400 rounded-2xl shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-wide text-white mb-4">
                {t("home.feature.market.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {t("home.feature.market.description")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- SECTION 4: HOW IT WORKS timeline --- */}
      <section className="relative z-10 bg-[#020105] py-32 overflow-hidden">
        {/* Ambient background for timeline */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #d946ef 0%, transparent 50%)" }}></div>
        
        <div className="max-w-7xl mx-auto w-full px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">
              {t("home.howitworks.title")}
            </h2>
            <p className="text-white/50 text-base md:text-lg">
              {t("home.howitworks.section.desc")}
            </p>
          </motion.div>

          {/* Responsive Timeline Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-12 relative"
          >
            {/* Connecting lines for Desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-white/5 z-0" />
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-accent via-blue-500 to-fuchsia-500 z-0 origin-left" 
            />

            {/* Step 1 */}
            <motion.div variants={fadeIn} className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-24 h-24 bg-[#050308] border border-accent/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(217,70,239,0.15)] group-hover:shadow-[0_0_50px_rgba(217,70,239,0.4)] group-hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
                <Lock className="w-10 h-10 text-accent relative z-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide text-white mb-3 group-hover:text-accent transition-colors">
                {t("home.howitworks.step1.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step1.desc")}
              </p>
            </motion.div>

            {/* Mobile Separator 1 */}
            <motion.div 
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="block md:hidden w-[2px] h-12 bg-gradient-to-b from-accent to-blue-500 mx-auto -my-6 relative z-0 origin-top" 
            />

            {/* Step 2 */}
            <motion.div variants={fadeIn} className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-24 h-24 bg-[#050308] border border-blue-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] group-hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                <ShoppingBag className="w-10 h-10 text-blue-400 relative z-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide text-white mb-3 group-hover:text-blue-400 transition-colors">
                {t("home.howitworks.step2.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step2.desc")}
              </p>
            </motion.div>

            {/* Mobile Separator 2 */}
            <motion.div 
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="block md:hidden w-[2px] h-12 bg-gradient-to-b from-blue-500 to-fuchsia-500 mx-auto -my-6 relative z-0 origin-top" 
            />

            {/* Step 3 */}
            <motion.div variants={fadeIn} className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-24 h-24 bg-[#050308] border border-fuchsia-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(217,70,239,0.15)] group-hover:shadow-[0_0_50px_rgba(217,70,239,0.4)] group-hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent"></div>
                <CheckCircle className="w-10 h-10 text-fuchsia-400 relative z-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide text-white mb-3 group-hover:text-fuchsia-400 transition-colors">
                {t("home.howitworks.step3.title")}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs font-medium">
                {t("home.howitworks.step3.desc")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 5: RECOMMENDATIONS --- */}
      <HomeSponsorsSection />
      <HomeReviewsSection />

      {/* --- SECTION 6: FINAL CTA BANNER --- */}
      <section className="relative z-10 py-32 text-center px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020105] to-[#050308] -z-10"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[3rem] p-6 sm:p-16 md:p-24 shadow-[0_0_100px_rgba(217,70,239,0.1)] backdrop-blur-xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight text-white mb-6">
                {t("home.cta.title")}
              </h2>
              <p className="max-w-2xl mx-auto text-white/60 text-lg md:text-xl leading-relaxed mb-12">
                {t("home.cta.desc")}
              </p>

              <div className="flex justify-center">
                <Link href={localizePath("/buy")}>
                  <Button className="h-16 px-12 bg-gradient-to-r from-accent to-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:shadow-[0_0_60px_rgba(217,70,239,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-500 group overflow-hidden relative border border-white/10">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      {t("home.cta.button")}
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo.webp" 
              alt="JabbuStore Logo" 
              width={40} 
              height={40} 
              className="object-contain rounded-md border border-white/10 shadow-sm" 
            />
            <span className="text-lg font-black uppercase tracking-widest text-white">
              Jabbu<span className="text-accent">Store</span>
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 text-center md:text-right max-w-lg leading-relaxed">
            {t("home.footer.disclaimer")}
          </div>
        </div>
      </footer>
    </div>
  );
}

