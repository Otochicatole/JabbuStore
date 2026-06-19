import React, { useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";

interface SuccessScreenProps {
  checkoutType: "buy" | "sell";
  createdOrderId: string | null;
  paymentMethod: string | null;
  onNavigateToOrders: () => void;
  onNavigateToHome: () => void;
}

const PAYMENT_PROOF_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const PAYMENT_PROOF_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export function SuccessScreen({
  checkoutType,
  createdOrderId,
  paymentMethod,
  onNavigateToOrders,
  onNavigateToHome,
}: SuccessScreenProps) {
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const handleCopyOrderId = () => {
    if (createdOrderId) {
      navigator.clipboard.writeText(createdOrderId);
    }
  };

  const handleProofSelect = (file: File | null) => {
    setProofError(null);
    setProofUploaded(false);

    if (!file) {
      setSelectedProof(null);
      return;
    }

    if (!PAYMENT_PROOF_ALLOWED_TYPES.has(file.type)) {
      setSelectedProof(null);
      setProofError("Formato no permitido. Usá JPG, PNG, WEBP, GIF o PDF.");
      return;
    }

    if (file.size > PAYMENT_PROOF_MAX_SIZE_BYTES) {
      setSelectedProof(null);
      setProofError("El comprobante no puede superar los 10 MB.");
      return;
    }

    setSelectedProof(file);
  };

  const handleProofUpload = async () => {
    if (!createdOrderId || !selectedProof) return;

    setUploadingProof(true);
    setProofError(null);

    try {
      const formData = new FormData();
      formData.append("proof", selectedProof);

      const response = await fetchWithAuth(
        `${BACKEND_URL}/orders/${createdOrderId}/payment-proof/buyer`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No pudimos subir el comprobante.");
      }

      setProofUploaded(true);
      setSelectedProof(null);
    } catch (err: unknown) {
      setProofError(err instanceof Error ? err.message : "No pudimos subir el comprobante.");
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510] px-6">
      <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 text-center max-w-lg shadow-2xl shadow-black/40 rounded-[3px]">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {checkoutType === "buy"
            ? "¡ORDEN DE COMPRA GENERADA!"
            : "¡Venta Listada con Éxito!"}
        </h2>
        <button
          onClick={handleCopyOrderId}
          className="text-xs text-emerald-400/90 font-bold uppercase tracking-wider mb-2 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 hover:bg-emerald-500/20 transition-all cursor-pointer rounded-[3px]"
          title="Copiar ID Completo"
        >
          ID de Orden:{" "}
          <span className="underline select-all">{createdOrderId}</span>
        </button>
        <p className="text-xs text-[#84849b] max-w-sm mx-auto leading-relaxed mb-8 mt-2">
          {checkoutType === "buy"
            ? paymentMethod === "manual_transfer"
              ? "Tu orden manual quedó registrada con comprobante. El admin revisará el pago y actualizará el estado para iniciar el envío de tus skins."
              : "Tu orden quedó registrada. El estado se actualizará automáticamente cuando la pasarela confirme el pago y el equipo iniciará el envío de tus skins."
            : "Tus skins fueron registradas correctamente y la operación quedó en seguimiento para su validación."}
        </p>

        {checkoutType === "buy" && createdOrderId && paymentMethod !== "manual_transfer" && (
          <div className="mb-8 text-left bg-[#110f1e]/60 border border-white/5 rounded-[3px] p-4 space-y-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                  Adjuntar Comprobante
                </h3>
                <p className="text-[10px] text-[#84849b] mt-1 leading-relaxed">
                  Adjuntalo después de pagar. Aceptamos JPG, PNG, WEBP, GIF o PDF hasta 10 MB.
                </p>
              </div>
            </div>

            <label className="block rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-accent/40 p-4 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="sr-only"
                disabled={uploadingProof}
                onChange={(event) => handleProofSelect(event.target.files?.[0] ?? null)}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                Seleccionar comprobante
              </span>
              <span className="block mt-1 text-xs font-bold text-white/80 truncate">
                {selectedProof
                  ? `${selectedProof.name} (${(selectedProof.size / 1024 / 1024).toFixed(2)} MB)`
                  : "Elegí el comprobante luego de completar el pago"}
              </span>
            </label>

            {proofError && (
              <p className="text-[10px] text-red-300 font-bold uppercase">{proofError}</p>
            )}

            {proofUploaded && (
              <p className="text-[10px] text-emerald-300 font-bold uppercase">
                Comprobante subido correctamente.
              </p>
            )}

            <button
              type="button"
              onClick={handleProofUpload}
              disabled={!selectedProof || uploadingProof}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[3px] bg-accent text-white text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {uploadingProof ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Subir comprobante
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onNavigateToOrders}
            className="px-6 py-3 rounded-[3px] bg-accent text-white text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] cursor-pointer"
          >
            Ver Mis Pedidos
          </button>
          <button
            onClick={onNavigateToHome}
            className="px-6 py-3 rounded-[3px] bg-white/[0.02] border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
export default SuccessScreen;
