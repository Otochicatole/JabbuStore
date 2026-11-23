"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { ExternalLink, Loader2, Send } from "lucide-react";
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
    "bg-[#a21caf]",
    "bg-[#be185d]",
    "bg-[#86198f]",
    "bg-[#c026d3]",
    "bg-[#9d174d]",
  ];
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index] ?? "bg-[#a21caf]";
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
    <section
      id="community-reviews"
      className="w-full bg-[#191527] px-5 sm:px-8 lg:px-12 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1440px] home-scroll-settle">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14 items-start">
          {/* Left column: Community heading + Steam review composer/login */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <h2 className="font-[family-name:var(--font-unbounded)] text-[clamp(1.75rem,3.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white text-balance">
                {t("home.recommendations.title")}
              </h2>
              <p className="mt-4 text-base sm:text-[17px] leading-[1.6] text-[#c3bdd9] max-w-[44ch]">
                {t("home.recommendations.desc")}
              </p>
            </div>

            <div className="rounded-[4px] bg-[#120d1e] p-6 sm:p-7">
              {checkingSession ? (
                <div className="flex min-h-20 items-center justify-center text-[#b7b1ce]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !profile ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t("home.reviews.login.title")}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-[#c3bdd9]">
                      {t("home.reviews.login.desc")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <SteamLoginButton />
                  </div>
                </div>
              ) : hasReview ? (
                <div className="rounded-[4px] bg-emerald-950/70 px-4 py-4 text-[14px] font-semibold text-emerald-300">
                  {submitMessage || t("home.reviews.form.received")}
                </div>
              ) : canSubmit ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#211c33]">
                      {profile.avatar ? (
                        <Image
                          src={profile.avatar}
                          alt={profile.name || "Steam User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                          {initialsFor(profile.name || "SU")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-white">
                        {profile.name || "Steam User"}
                      </p>
                      <p className="text-[13px] font-medium text-[#b7b1ce]">
                        {t("home.reviews.form.label")}
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={body}
                    maxLength={500}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={t("home.reviews.form.placeholder")}
                    className="min-h-28 w-full resize-none rounded-[4px] bg-[#191527] px-4 py-3 text-base leading-relaxed text-white outline-none placeholder:text-[#9891b3] focus-visible:outline-2 focus-visible:outline-[#d946ef]"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[13px] font-medium tabular-nums text-[#b7b1ce]">
                      {body.trim().length}/500
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#d946ef] px-5 text-[14px] font-bold uppercase tracking-[0.06em] text-[#090612] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d946ef]"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {t("home.reviews.form.submit")}
                    </button>
                  </div>
                  {submitError && (
                    <p className="rounded-[4px] bg-rose-950/70 px-4 py-3 text-[14px] font-semibold text-rose-200">
                      {submitError}
                    </p>
                  )}
                </form>
              ) : null}
            </div>
          </div>

          {/* Right column: Published community reviews */}
          <div className="lg:col-span-7 rounded-[4px] bg-[#211c33] p-5 sm:p-7">
            <div className="max-h-[480px] overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
              {loadingReviews ? (
                <div className="flex min-h-44 items-center justify-center text-[#c3bdd9]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[14px] font-bold uppercase text-[#c3bdd9]">
                    {t("home.reviews.empty")}
                  </p>
                </div>
              ) : (
                reviews.map((review) => {
                  const name = review.user.name || "Steam User";
                  const initials = initialsFor(name);
                  return (
                    <article
                      key={review.id}
                      className="rounded-[4px] bg-[#191527] p-5 sm:p-6 flex flex-col gap-3 text-left transition-colors duration-150 hover:bg-[#141021]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative h-10 w-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColorFor(review.id)}`}
                        >
                          {review.user.avatar ? (
                            <Image src={review.user.avatar} alt={name} fill className="object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="text-[15px] font-bold text-white leading-snug">
                            {name}{" "}
                            <span className="font-normal text-[#c3bdd9]">
                              {t("home.reviews.recommends")}
                            </span>{" "}
                            <span className="text-[#d946ef]">JabbuStore</span>
                          </div>
                          <time
                            dateTime={review.createdAt}
                            className="text-[13px] font-medium text-[#b7b1ce] mt-0.5"
                          >
                            {dateFormatter.format(new Date(review.createdAt))}
                          </time>
                        </div>
                        {review.user.profileUrl ? (
                          <a
                            href={review.user.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto p-2 text-[#b7b1ce] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#d946ef] rounded-[4px]"
                            aria-label={t("home.reviews.openProfile")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>

                      <p className="text-base text-white/95 leading-[1.6] break-words">
                        {review.body}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
