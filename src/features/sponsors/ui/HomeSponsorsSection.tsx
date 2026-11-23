"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
          setSponsors(Array.isArray(data) ? data : []);
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
    <section className="w-full bg-[#120d1e] px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
      <div className="mx-auto max-w-[1440px] home-scroll-settle">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end mb-14">
          <div className="lg:col-span-6">
            <h2 className="font-[family-name:var(--font-unbounded)] text-[clamp(1.75rem,3.4vw,2.85rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white text-balance">
              {t("home.sponsors.title")}
            </h2>
          </div>
          <div className="lg:col-span-6 lg:flex lg:justify-end">
            <p className="text-base sm:text-[17px] leading-[1.6] text-[#c3bdd9] max-w-[44ch]">
              {t("home.sponsors.desc")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="group flex flex-col items-center justify-center gap-3 rounded-[4px] bg-[#191527] px-5 py-6 transition-colors duration-200 hover:bg-[#211c33]"
              aria-label={sponsor.name}
            >
              <div className="relative flex h-20 w-full items-center justify-center">
                <Image
                  src={sponsorImageUrl(sponsor)}
                  alt={sponsor.name}
                  width={180}
                  height={80}
                  loading="lazy"
                  className="max-h-16 w-auto max-w-full object-contain opacity-85 grayscale transition-[opacity,filter,transform] duration-200 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105"
                />
              </div>
              <span className="max-w-full truncate text-center text-[13px] font-semibold text-[#c3bdd9] group-hover:text-white transition-colors">
                {sponsor.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
