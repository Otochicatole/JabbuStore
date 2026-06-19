"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, X } from "lucide-react";
import { fetchWithAuth } from "@/shared/lib/api";

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
  title = "Comprobante de pago",
}: PaymentProofModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = proof?.mimeType?.startsWith("image/");
  const isPdf = proof?.mimeType === "application/pdf";

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
          throw new Error("No pudimos cargar el comprobante.");
        }

        const blob = await response.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No pudimos cargar el comprobante.");
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
  }, [open, proofUrl]);

  const uploadedAt = proof?.uploadedAt
    ? new Date(proof.uploadedAt).toLocaleString("es-AR")
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/85 backdrop-blur-sm p-3 sm:p-6">
      <div className="h-full max-w-6xl mx-auto bg-card border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-white/10">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              {title}
            </h3>
            <p className="text-[10px] text-[#84849b] mt-1 truncate">
              {proof?.fileName || "Comprobante"} {formatSize(proof?.size)}
              {uploadedAt ? ` · ${uploadedAt}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {objectUrl && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
              aria-label="Cerrar comprobante"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-black/30 flex items-center justify-center p-3 sm:p-6">
          {loading && (
            <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase">
              <Loader2 size={16} className="animate-spin" />
              Cargando comprobante...
            </div>
          )}

          {error && <p className="text-sm text-red-300 font-bold">{error}</p>}

          {!loading && !error && objectUrl && isImage && (
            <img
              src={objectUrl}
              alt={proof?.fileName || "Comprobante de pago"}
              className="max-h-full max-w-full object-contain rounded-xl"
            />
          )}

          {!loading && !error && objectUrl && isPdf && (
            <iframe
              src={objectUrl}
              title={proof?.fileName || "Comprobante PDF"}
              className="w-full h-full rounded-xl bg-white"
            />
          )}

          {!loading && !error && objectUrl && !isImage && !isPdf && (
            <div className="text-center text-white/60">
              <FileText className="mx-auto mb-3" size={34} />
              <p className="text-sm font-bold">Abrí el archivo en una nueva pestaña.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

