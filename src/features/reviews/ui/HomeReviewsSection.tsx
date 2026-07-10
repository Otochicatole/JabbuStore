"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Globe, Loader2, MoreHorizontal, Send } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { SteamLoginButton } from "@/shared/components/SteamLoginButton";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface PublicReview {
  id: string;
  body: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string | null;
    profileUrl: string | null;
  };
}

interface UserProfile {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface MyReviewState {
  canSubmit: boolean;
  hasReview: boolean;
  review: {
    id: string;
    body: string;
    createdAt: string;
  } | null;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColorFor(seed: string) {
  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-rose-600",
    "bg-violet-600",
    "bg-orange-600",
    "bg-fuchsia-600",
  ];
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index] ?? "bg-blue-600";
}

export function HomeReviewsSection() {
  const { locale, t } = useI18n();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myReviewState, setMyReviewState] = useState<MyReviewState | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dateFormatter = useMemo(() => {
    const localeCode = locale === "br" ? "pt-BR" : locale === "es" ? "es-AR" : "en-US";
    return new Intl.DateTimeFormat(localeCode, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [locale]);

  const loadPublicReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${BACKEND_URL}/reviews/public?limit=12`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("REVIEWS_LOAD_FAILED");
      setReviews((await response.json()) as PublicReview[]);
    } catch (error) {
      console.error("Error loading public reviews:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  const loadSessionReviewState = useCallback(async () => {
    setCheckingSession(true);
    try {
      const profileResponse = await fetchWithAuth(`${BACKEND_URL}/users/me`);
      if (!profileResponse.ok) {
        setProfile(null);
        setMyReviewState(null);
        return;
      }

      setProfile((await profileResponse.json()) as UserProfile);
      const reviewResponse = await fetchWithAuth(`${BACKEND_URL}/reviews/me`);
      if (reviewResponse.ok) {
        setMyReviewState((await reviewResponse.json()) as MyReviewState);
      }
    } catch (error) {
      console.error("Error loading user review state:", error);
      setProfile(null);
      setMyReviewState(null);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPublicReviews();
      void loadSessionReviewState();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPublicReviews, loadSessionReviewState]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (trimmedBody.length < 3) {
      setSubmitError(t("home.reviews.form.tooShort"));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/reviews`, {
        method: "POST",
        body: JSON.stringify({ body: trimmedBody }),
      });

      const data = (await response.json().catch(() => ({}))) as MyReviewState & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("home.reviews.form.error"));
      }

      setBody("");
      setMyReviewState(data);
      setSubmitMessage(t("home.reviews.form.success"));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("home.reviews.form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(profile && (myReviewState?.canSubmit ?? true));
  const hasReview = Boolean(profile && myReviewState?.hasReview);

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
          <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">Feedback</span>
          <span className="w-8 h-[1px] bg-accent"></span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">
          {t("home.recommendations.title")}
        </h2>
        <p className="text-white/50 text-base md:text-lg leading-relaxed">
          {t("home.recommendations.desc")}
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto mb-6 rounded-[2rem] border border-white/5 bg-[#110e1a]/40 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        {checkingSession ? (
          <div className="flex min-h-24 items-center justify-center text-white/40">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-black text-white">{t("home.reviews.login.title")}</p>
              <p className="mt-1 text-xs font-medium text-white/45">{t("home.reviews.login.desc")}</p>
            </div>
            <SteamLoginButton />
          </div>
        ) : hasReview ? (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-center text-xs font-bold text-emerald-300">
            {submitMessage || t("home.reviews.form.received")}
          </div>
        ) : canSubmit ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name || "Steam User"} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                    {initialsFor(profile.name || "SU")}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-black text-white">{profile.name || "Steam User"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  {t("home.reviews.form.label")}
                </p>
              </div>
            </div>
            <textarea
              value={body}
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t("home.reviews.form.placeholder")}
              className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-[#0b0813]/70 px-4 py-3 text-sm font-medium leading-relaxed text-white outline-none transition-all placeholder:text-white/25 focus:border-accent/40"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] font-bold text-white/35">{body.trim().length}/500</span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-accent px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("home.reviews.form.submit")}
              </button>
            </div>
            {submitError && (
              <p className="rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-300">
                {submitError}
              </p>
            )}
          </form>
        ) : null}
      </div>

      <div className="max-w-3xl mx-auto w-full bg-[#110e1a]/40 border border-white/5 rounded-[2rem] p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="max-h-[500px] overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loadingReviews ? (
            <div className="flex min-h-40 items-center justify-center text-white/40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-12 text-center text-xs font-black uppercase tracking-widest text-white/35">
              {t("home.reviews.empty")}
            </p>
          ) : (
            reviews.map((review) => {
              const name = review.user.name || "Steam User";
              const initials = initialsFor(name);
              return (
                <div
                  key={review.id}
                  className="bg-[#242526]/30 border border-white/5 hover:border-accent/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left transition-all duration-300 relative group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner ${avatarColorFor(review.id)}`}>
                      {review.user.avatar ? (
                        <Image src={review.user.avatar} alt={name} fill className="object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-xs font-bold text-white leading-tight">
                        {name}{" "}
                        <span className="text-white/50 font-normal text-[11px]">
                          {t("home.reviews.recommends")}
                        </span>{" "}
                        <span className="text-accent font-black">JabbuStore.</span>
                      </div>
                      <div className="text-[10px] text-white/35 flex items-center gap-1 mt-1 font-semibold">
                        <span>{dateFormatter.format(new Date(review.createdAt))}</span>
                        <span>·</span>
                        <Globe className="w-3 h-3 text-white/30" />
                      </div>
                    </div>
                    {review.user.profileUrl ? (
                      <a
                        href={review.user.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-white/30 hover:text-white transition-colors p-1"
                        aria-label={t("home.reviews.openProfile")}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </a>
                    ) : (
                      <MoreHorizontal className="ml-auto w-4 h-4 text-white/20" />
                    )}
                  </div>

                  <p className="text-[13px] sm:text-[14px] text-white/95 font-medium leading-relaxed break-words relative z-10 pl-1 py-1">
                    {review.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
