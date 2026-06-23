"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchWithAuth, BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

interface UserProfile {
  id: string;
  email: string | null;
  tradeUrl: string | null;
}

export function ProfileCompletionModal() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const localizePath = useLocalizedPath();

  const [isOpen, setIsOpen] = useState(false);
  const dismissedThisPageLoadRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const normalizedPathname = stripLocaleFromPathname(pathname);
    const shouldSkipRoute =
      normalizedPathname.startsWith("/admin") || normalizedPathname === "/profile";
    const checkProfile = async () => {
      if (shouldSkipRoute) {
        setIsOpen(false);
        return;
      }

      if (dismissedThisPageLoadRef.current) {
        setIsOpen(false);
        return;
      }

      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/users/me`);
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as UserProfile;
        const isIncomplete = !data.email?.trim() || !data.tradeUrl?.trim();
        if (!cancelled) {
          setIsOpen(isIncomplete);
        }
      } catch (err) {
        console.error("Error checking profile completion:", err);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void checkProfile();
    }, 0);

    const handleFocus = () => {
      void checkProfile();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [pathname]);

  const handleClose = () => {
    dismissedThisPageLoadRef.current = true;
    setIsOpen(false);
  };

  const handleGoToProfile = () => {
    setIsOpen(false);
    router.push(localizePath("/profile"));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop click closes modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 cursor-default"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden bg-[#110f1e]/90 border border-accent/25 rounded-3xl p-6 shadow-[0_0_50px_rgba(217,70,239,0.15)] backdrop-blur-xl z-10"
          >
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              aria-label={t("common.close")}
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-accent animate-pulse" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
                {t("profile.incomplete.title")}
              </h3>

              {/* Description */}
              <p className="text-xs text-[#84849b] leading-relaxed mb-6 max-w-xs font-medium">
                {t("profile.incomplete.description")}
              </p>

              {/* Actions */}
              <div className="flex flex-col w-full gap-2.5">
                <button
                  onClick={handleGoToProfile}
                  className="w-full py-3 bg-accent hover:bg-accent/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.25)] flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>{t("profile.incomplete.proceed")}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl border border-white/5 transition-all cursor-pointer"
                >
                  {t("profile.incomplete.later")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
