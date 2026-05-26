import React from 'react';
import { CheckCircle2 } from 'lucide-react';

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
  onNavigateToHome
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510] px-6">
      <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center max-w-lg shadow-2xl shadow-black/40">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6 animate-bounce" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {checkoutType === "buy" ? "¡Pago Simulado Exitoso!" : "¡Venta Listada con Éxito!"}
        </h2>
        <p className="text-sm text-emerald-400/90 font-bold uppercase tracking-wider mb-2">
          ID del Pedido: {createdOrderId?.slice(0, 8)}...
        </p>
        <p className="text-xs text-[#84849b] max-w-sm mx-auto leading-relaxed mb-8">
          {checkoutType === "buy" 
            ? "Tu transacción ha sido procesada de manera correcta. El bot de Steam iniciará el envío de tus Skins en breve."
            : "Tus skins han sido ingresadas correctamente en el Marketplace y la transacción está en cola para su validación."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={onNavigateToOrders} 
            className="px-6 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] cursor-pointer"
          >
            Ver Mis Pedidos
          </button>
          <button 
            onClick={onNavigateToHome} 
            className="px-6 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
export default SuccessScreen;
