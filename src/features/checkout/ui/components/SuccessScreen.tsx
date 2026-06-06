import React from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessScreenProps {
  checkoutType: "buy" | "sell";
  createdOrderId: string | null;
  onNavigateToOrders: () => void;
  onNavigateToHome: () => void;
}

export function SuccessScreen({
  checkoutType,
  createdOrderId,
  onNavigateToOrders,
  onNavigateToHome,
}: SuccessScreenProps) {
  const handleCopyOrderId = () => {
    if (createdOrderId) {
      navigator.clipboard.writeText(createdOrderId);
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
            ? "Su pago está siendo procesado de forma automática por Mercado Pago. El bot de Steam iniciará el envío de sus Skins tan pronto como se reciba la acreditación."
            : "Tus skins han sido ingresadas correctamente en el Marketplace y la transacción está en cola para su validación."}
        </p>
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
