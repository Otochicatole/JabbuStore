"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface PublicSponsor {
  id: string;
  name: string;
  displayOrder: number;
  updatedAt: string;
}

const sponsorImageUrl = (sponsor: PublicSponsor) =>
  `${BACKEND_URL}/sponsors/${sponsor.id}/image/${encodeURIComponent(sponsor.updatedAt)}`;

const sponsorsContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const sponsorItem = {
  hidden: { opacity: 0, y: 18, scale: 0.94, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export function HomeSponsorsSection() {
  const { t } = useI18n();
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BACKEND_URL}/sponsors/public`, {
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("SPONSORS_LOAD_FAILED");
        return response.json();
      })
      .then((data: PublicSponsor[]) => {
        if (!cancelled) {
          setSponsors(data);
        }
      })
      .catch((error) => {
        console.error("Error loading sponsors:", error);
        if (!cancelled) {
          setSponsors([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 border-t border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <div className="inline-flex items-center justify-center gap-2 mb-4">
          <span className="w-8 h-[1px] bg-accent"></span>
          <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">
            {t("home.sponsors.eyebrow")}
          </span>
          <span className="w-8 h-[1px] bg-accent"></span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">
          {t("home.sponsors.title")}
        </h2>
        <p className="text-white/50 text-base md:text-lg leading-relaxed">
          {t("home.sponsors.desc")}
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sponsorsContainer}
        className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {sponsors.map((sponsor, index) => (
          <motion.div
            key={sponsor.id}
            variants={sponsorItem}
            whileHover={{ y: -8, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="group relative flex h-36 flex-col items-center justify-center gap-3 px-3 py-2"
            aria-label={sponsor.name}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (index % 5) * 0.18,
              }}
              className="relative flex h-24 w-full items-center justify-center"
            >
              <Image
                src={sponsorImageUrl(sponsor)}
                alt={sponsor.name}
                width={180}
                height={80}
                className="relative z-10 max-h-20 w-auto max-w-full object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:drop-shadow-[0_0_18px_rgba(217,70,239,0.35)]"
              />
            </motion.div>
            <span className="h-5 max-w-full translate-y-2 truncate text-center text-[10px] font-black uppercase tracking-[0.18em] text-accent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {sponsor.name}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
