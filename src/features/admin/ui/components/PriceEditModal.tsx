import React, { useState } from "react";
import {
  X,
  ToggleRight,
  ToggleLeft,
  DollarSign,
  XCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { StoreItem } from "../../domain/types";
import { BACKEND_URL } from "@/shared/lib/api";

interface PriceEditModalProps {
  item: StoreItem;
  onClose: () => void;
  onSuccess: (updatedItem: StoreItem) => void;
}

export function PriceEditModal({
  item,
  onClose,
  onSuccess,
}: PriceEditModalProps) {
  const [manualEnabled, setManualEnabled] = useState(
    item.isPriceManual ?? false,
  );
  const [priceValue, setPriceValue] = useState(item.price.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const parsedPrice = parseFloat(priceValue);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Ingresá un precio numérico válido mayor o igual a 0.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/marketplace/store/items/${item.assetId}/price`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            price: parsedPrice,
            isPriceManual: manualEnabled,
          }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el precio del artículo.");
      }

      onSuccess({
        ...item,
        price: parsedPrice,
        isPriceManual: manualEnabled,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error de conexión al actualizar el precio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md bg-[#110f1e] border border-white/10 shadow-[0_0_60px_rgba(217,70,239,0.15)] overflow-hidden rounded-[3px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt={item.name}
                className="w-10 h-8 object-contain rounded-[3px]"
              />
            ) : (
              <div className="w-10 h-8 bg-white/5 rounded-[3px]" />
            )}
            <div>
              <p className="text-xs font-black text-white line-clamp-1">
                {item.name}
              </p>
              <p className="text-[10px] text-[#84849b] font-mono mt-0.5">
                {item.exterior ?? item.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[3px] text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Switch de precio manual */}
          <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-[3px]">
            <div>
              <p className="text-sm font-bold text-white">Precio Manual</p>
              <p className="text-[11px] text-[#84849b] mt-0.5 leading-snug">
                {manualEnabled
                  ? "Activo — la sincronización automática no sobreescribirá este precio."
                  : "Desactivado — el precio se actualiza automáticamente con el mercado."}
              </p>
            </div>
            <button
              onClick={() => setManualEnabled((v) => !v)}
              className="ml-4 flex-shrink-0 cursor-pointer transition-all"
              aria-label="Toggle precio manual"
            >
              {manualEnabled ? (
                <ToggleRight className="w-12 h-12 text-accent drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-white/20" />
              )}
            </button>
          </div>

          {/* Input de precio */}
          <div
            className={`space-y-2 transition-opacity duration-200 ${manualEnabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <label className="text-xs font-black uppercase tracking-widest text-[#84849b] font-mono">
              Precio en USD
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                disabled={!manualEnabled}
                className="w-full pl-10 pr-4 py-3.5 bg-[#0d0b1a] border-2 border-accent/30 focus:border-accent text-white text-base font-bold font-mono focus:outline-none focus:shadow-[0_0_20px_rgba(217,70,239,0.15)] transition-all placeholder-white/20 rounded-[3px]"
                placeholder="0.00"
              />
            </div>
            <p className="text-[10px] text-[#84849b] font-mono">
              Precio actual del mercado:{" "}
              <span className="text-white font-bold">
                ${item.price.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-[3px]">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all cursor-pointer rounded-[3px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.3)] disabled:opacity-50 rounded-[3px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Guardar Precio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
