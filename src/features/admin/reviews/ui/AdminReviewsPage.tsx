"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, Clock, ExternalLink, MessageSquare, RefreshCw, User, XCircle } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminStatCard,
  AdminStatusTabs,
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
        return { label: t("admin.reviews.status.pending"), tone: "warning" as const, icon: Clock };
      case "APPROVED":
        return { label: t("admin.reviews.status.approved"), tone: "success" as const, icon: CheckCircle };
      case "REJECTED":
        return { label: t("admin.reviews.status.rejected"), tone: "danger" as const, icon: XCircle };
    }
  };

  const statusTabs = useMemo(
    () => [
      { value: "ALL" as StatusFilter, label: t("admin.reviews.status.all") },
      { value: "PENDING" as StatusFilter, label: t("admin.reviews.status.pending") },
      { value: "APPROVED" as StatusFilter, label: t("admin.reviews.status.approved") },
      { value: "REJECTED" as StatusFilter, label: t("admin.reviews.status.rejected") },
    ],
    [t],
  );

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.reviews.title")}
        description={t("admin.reviews.description")}
        icon={MessageSquare}
        actions={
          <AdminButton icon={RefreshCw} onClick={fetchReviews} disabled={loading} loading={loading}>
            {t("admin.reviews.refresh")}
          </AdminButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label={t("admin.reviews.status.pending")}
          value={<span className="text-amber-300">{statusSummary.PENDING}</span>}
          icon={Clock}
          tone="yellow"
          loading={loading}
        />
        <AdminStatCard
          label={t("admin.reviews.status.approved")}
          value={<span className="text-emerald-400">{statusSummary.APPROVED}</span>}
          icon={CheckCircle}
          tone="green"
          loading={loading}
        />
        <AdminStatCard
          label={t("admin.reviews.status.rejected")}
          value={<span className="text-rose-300">{statusSummary.REJECTED}</span>}
          icon={XCircle}
          tone="accent"
          loading={loading}
        />
      </div>

      <AdminStatusTabs
        items={statusTabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <AdminToolbar>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("admin.reviews.search")}
        />
      </AdminToolbar>

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading && reviews.length === 0 ? (
        <AdminLoadingState label={t("admin.reviews.loading")} />
      ) : filteredReviews.length === 0 ? (
        <AdminEmptyState icon={MessageSquare} title={t("admin.reviews.empty")} />
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const name = review.user.name || "Steam User";
            const status = statusConfig(review.status);
            const StatusIcon = status.icon;
            const isMutating = mutatingId === review.id;
            return (
              <AdminSection key={review.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#1c1833] text-xs font-semibold text-white">
                        {review.user.avatar ? (
                          <Image src={review.user.avatar} alt={name} fill className="object-cover" />
                        ) : (
                          initialsFor(name) || <User className="h-4 w-4 text-[#9e98b6]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{name}</p>
                          <AdminBadge tone={status.tone}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </AdminBadge>
                          <AdminBadge tone="neutral">{review.source}</AdminBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-[#8e88a6]">
                          {dateFormatter.format(new Date(review.createdAt))}
                          {review.user.steamId ? ` · Steam ID: ${review.user.steamId}` : ""}
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap break-words rounded-lg border border-white/[0.06] bg-[#0e0b1a] p-3.5 text-sm leading-relaxed text-white/90">
                      {review.body}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    {review.user.profileUrl && (
                      <a
                        href={review.user.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#1c1833] px-3.5 text-xs font-semibold text-white hover:bg-[#252042] transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
