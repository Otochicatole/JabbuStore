import React from 'react';
import { DollarSign, ArrowRight } from 'lucide-react';

interface OrderSummaryProps {
  itemsCount: number;
  totalPrice: number;
  selectedMethod: string | null;
  isSimulating: boolean;
  checkoutType: "buy" | "sell";
  onSubmit: () => void;
}

export function OrderSummary({
  itemsCount,
  totalPrice,
  selectedMethod,
  isSimulating,
  checkoutType,
  onSubmit
}: OrderSummaryProps) {
  return (
    <div className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">Resumen del Pedido</h2>

      <div className="space-y-4 font-sans border-b border-white/5 pb-6 mb-6">
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>Subtotal ({itemsCount} items)</span>
          <span className="text-white">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>Comisión de Pasarela (Simulada)</span>
          <span className="text-emerald-400">Gratis (0.00)</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>Impuestos de Blockchain / Red</span>
          <span className="text-emerald-400">Bonificado</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Monto Final</span>
          <span className="text-2xl font-black text-white block tracking-tighter mt-1">${totalPrice.toFixed(2)} USD</span>
        </div>
        <div className="p-3 bg-accent/10 rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-accent" />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!selectedMethod || isSimulating}
        className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_0_35px_rgba(217,70,239,0.35)] hover:shadow-[0_0_45px_rgba(217,70,239,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {checkoutType === "buy" ? "Completar Pago" : "Confirmar Venta"}
        <ArrowRight className="w-4 h-4" />
      </button>

      {!selectedMethod && (
        <p className="text-[9px] text-center text-[#84849b] mt-4 font-bold uppercase tracking-wider">
          Selecciona un método de pago arriba
        </p>
      )}
    </div>
  );
}
export default OrderSummary;
