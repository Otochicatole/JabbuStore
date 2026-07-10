"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, Clock, ExternalLink, MessageSquare, RefreshCw, User, XCircle } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
type ReviewSource = "STEAM" | "LEGACY";
type StatusFilter = "ALL" | ReviewStatus;

interface AdminReview {
  id: string;
  body: string;
  status: ReviewStatus;
  source: ReviewSource;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    profileUrl: string | null;
    steamId: string | null;
    email: string | null;
  };
}

const statusFilters: StatusFilter[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function getInitialStatusFilter(): StatusFilter {
  if (typeof window === "undefined") return "ALL";
  const status = new URLSearchParams(window.location.search).get("status");
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    return status;
  }
  return "ALL";
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminReviewsPage() {
  const { locale, t } = useI18n();
  const localizePath = useLocalizedPath();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(getInitialStatusFilter);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const dateFormatter = useMemo(() => {
    const localeCode = locale === "br" ? "pt-BR" : locale === "es" ? "es-AR" : "en-US";
    return new Intl.DateTimeFormat(localeCode, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const response = await fetchWithAuth(`${BACKEND_URL}/reviews/admin/all${query}`);
      if (response.status === 401 || response.status === 403) {
        window.location.href = localizePath("/admin/login");
        return;
      }
      if (!response.ok) {
        throw new Error(t("admin.reviews.error.load"));
      }
      setReviews((await response.json()) as AdminReview[]);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.reviews.error.load"));
    } finally {
      setLoading(false);
    }
  }, [localizePath, statusFilter, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReviews();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReviews]);

  const mutateReview = async (reviewId: string, action: "approve" | "reject") => {
    setMutatingId(reviewId);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/reviews/admin/${reviewId}/${action}`, {
        method: "PATCH",
      });
      const data = (await response.json().catch(() => ({}))) as AdminReview & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("admin.reviews.error.update"));
      }
      setReviews((current) => current.map((review) => (review.id === reviewId ? data : review)));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.reviews.error.update"));
    } finally {
      setMutatingId(null);
    }
  };

  const statusSummary = useMemo(() => {
    return reviews.reduce<Record<ReviewStatus, number>>(
      (summary, review) => {
        summary[review.status] += 1;
        return summary;
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0 },
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return reviews;
    return reviews.filter((review) => {
      const searchable = [
        review.body,
        review.user.name,
        review.user.email,
        review.user.steamId,
        review.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [reviews, searchTerm]);

  const statusConfig = (status: ReviewStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: t("admin.reviews.status.pending"),
          className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
          icon: Clock,
        };
      case "APPROVED":
        return {
          label: t("admin.reviews.status.approved"),
          className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          icon: CheckCircle,
        };
      case "REJECTED":
        return {
          label: t("admin.reviews.status.rejected"),
          className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
          icon: XCircle,
        };
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.reviews.title")}
        description={t("admin.reviews.description")}
        icon={MessageSquare}
        actions={
          <AdminButton icon={RefreshCw} onClick={fetchReviews} disabled={loading}>
            {t("admin.reviews.refresh")}
          </AdminButton>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminSection>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
            {t("admin.reviews.status.pending")}
          </p>
          <p className="mt-2 text-2xl font-black text-amber-300">{statusSummary.PENDING}</p>
        </AdminSection>
        <AdminSection>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
            {t("admin.reviews.status.approved")}
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{statusSummary.APPROVED}</p>
        </AdminSection>
        <AdminSection>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
            {t("admin.reviews.status.rejected")}
          </p>
          <p className="mt-2 text-2xl font-black text-rose-300">{statusSummary.REJECTED}</p>
        </AdminSection>
      </div>

      <AdminToolbar>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("admin.reviews.search")}
        />
        <div className="flex min-w-0 overflow-x-auto rounded-[3px] border border-white/5 bg-white/[0.03] p-1">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-9 shrink-0 rounded-[3px] px-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? "bg-accent text-white"
                  : "text-[#84849b] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {status === "ALL" ? t("admin.reviews.status.all") : statusConfig(status).label}
            </button>
          ))}
        </div>
      </AdminToolbar>

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading && reviews.length === 0 ? (
        <AdminLoadingState label={t("admin.reviews.loading")} />
      ) : filteredReviews.length === 0 ? (
        <AdminEmptyState icon={MessageSquare} title={t("admin.reviews.empty")} />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const name = review.user.name || "Steam User";
            const status = statusConfig(review.status);
            const StatusIcon = status.icon;
            const isMutating = mutatingId === review.id;
            return (
              <AdminSection key={review.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-white/10 bg-white/[0.04] text-xs font-black text-white">
                        {review.user.avatar ? (
                          <Image src={review.user.avatar} alt={name} fill className="object-cover" />
                        ) : (
                          initialsFor(name) || <User className="h-5 w-5 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-white">{name}</p>
                          <span className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${status.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                          <span className="rounded-[3px] border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white/45">
                            {review.source}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] font-bold text-[#84849b]">
                          {dateFormatter.format(new Date(review.createdAt))}
                          {review.user.steamId ? ` · Steam ID: ${review.user.steamId}` : ""}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap break-words rounded-[3px] border border-white/5 bg-black/20 p-4 text-sm font-medium leading-relaxed text-white/90">
                      {review.body}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    {review.user.profileUrl && (
                      <a
                        href={review.user.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/[0.07]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("admin.reviews.profile")}
                      </a>
                    )}
                    {review.status !== "APPROVED" && (
                      <AdminButton
                        icon={CheckCircle}
                        variant="success"
                        loading={isMutating}
                        disabled={isMutating}
                        onClick={() => void mutateReview(review.id, "approve")}
                      >
                        {t("admin.reviews.approve")}
                      </AdminButton>
                    )}
                    {review.status !== "REJECTED" && (
                      <AdminButton
                        icon={XCircle}
                        variant="danger"
                        loading={isMutating}
                        disabled={isMutating}
                        onClick={() => void mutateReview(review.id, "reject")}
                      >
                        {t("admin.reviews.reject")}
                      </AdminButton>
                    )}
                  </div>
                </div>
              </AdminSection>
            );
          })}
        </div>
      )}
    </div>
  );
}
