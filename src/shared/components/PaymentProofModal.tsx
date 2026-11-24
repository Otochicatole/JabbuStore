"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, Loader2, X } from "lucide-react";
import { fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

export interface PaymentProofInfo {
  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  uploadedAt?: string | null;
}

interface PaymentProofModalProps {
  open: boolean;
  onClose: () => void;
  proofUrl: string | null;
  proof: PaymentProofInfo | null | undefined;
  title?: string;
}

const formatSize = (size?: number | null) => {
  if (!size) return "";
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

export function PaymentProofModal({
  open,
  onClose,
  proofUrl,
  proof,
  title,
}: PaymentProofModalProps) {
  const { locale, t } = useI18n();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = proof?.mimeType?.startsWith("image/");
  const isPdf = proof?.mimeType === "application/pdf";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !proofUrl) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    const loadProof = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(proofUrl);
        if (!response.ok) {
          throw new Error(t("proof.error"));
        }

        const blob = await response.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("proof.error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProof();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setObjectUrl(null);
    };
  }, [open, proofUrl, t]);

  const uploadedAt = proof?.uploadedAt
    ? new Date(proof.uploadedAt).toLocaleString(locale === "es" ? "es-AR" : "en-US")
    : null;

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#141124] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white">
              {title || t("proof.title")}
            </h3>
            <p className="mt-0.5 truncate text-xs text-[#9e98b6]">
              {proof?.fileName || t("proof.title")} {formatSize(proof?.size)}
              {uploadedAt ? ` · ${uploadedAt}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {objectUrl && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#c2bdd6] hover:text-white transition-colors"
                title={t("proof.openNewTab")}
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#c2bdd6] hover:text-white transition-colors cursor-pointer"
              aria-label={t("common.close")}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0b0914] p-4 sm:p-6">
          {loading && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#9e98b6]">
              <Loader2 size={16} className="animate-spin text-accent" />
              {t("proof.loading")}
            </div>
          )}

          {error && <p className="text-sm font-medium text-rose-300">{error}</p>}

          {!loading && !error && objectUrl && isImage && (
            <img
              src={objectUrl}
              alt={proof?.fileName || t("proof.title")}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          )}

          {!loading && !error && objectUrl && isPdf && (
            <iframe
              src={objectUrl}
              title={proof?.fileName || t("proof.openPdf")}
              className="h-full w-full rounded-lg bg-white"
            />
          )}

          {!loading && !error && objectUrl && !isImage && !isPdf && (
            <div className="text-center text-[#9e98b6]">
              <FileText className="mx-auto mb-3" size={34} />
              <p className="text-sm font-medium">{t("proof.openInNewTab")}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
