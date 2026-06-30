"use client";

import React from "react";
import { motion } from "framer-motion";
import { BACKEND_URL } from "@/shared/lib/api";
import Image from "next/image";
import { useI18n } from "@/shared/i18n/I18nProvider";

export const SteamLoginButton = () => {
  const { t } = useI18n();

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/steam`;
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleLogin}
      className="group relative flex h-10 w-[60px] sm:w-[140px] items-center justify-between gap-3 overflow-hidden rounded-full bg-[#110f1e]/90 p-2 font-bold text-white transition-all duration-300 border border-white/5 hover:border-accent/40 shadow-md hover:shadow-[0_0_15px_rgba(217,70,239,0.25)] shrink-0 cursor-pointer"
    >
      {/* Subtle background glow on hover inside the button */}
      <div className="absolute inset-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/5" />

      {/* Shine effect */}
      <div className="absolute -left-full top-0 h-full w-1/2 skew-x-[-25deg] bg-linear-to-r from-transparent via-white/5 to-transparent transition-all duration-500 group-hover:left-[150%]" />

      <div className="relative overflow-hidden rounded-full flex items-center justify-center">
        <Image
          src="/steam.webp"
          alt="Steam Icon"
          width={40}
          height={40}
          className="relative z-10 min-h-8 min-w-11"
        />
      </div>

      <span className="relative z-10 text-[9px] sm:text-[9.5px] tracking-[0.15em] uppercase font-black shrink-0 hidden sm:inline">
        {t("steam.login")}
      </span>

      <div className="w-4" />
    </motion.button>
  );
};
