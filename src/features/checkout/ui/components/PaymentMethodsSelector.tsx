import React from 'react';
import { PAYMENT_METHODS } from '../../domain/constants';
import { ManualTransferSettings } from '../../domain/types';

interface PaymentMethodsSelectorProps {
  selectedMethod: string | null;
  onSelectMethod: (method: string) => void;
  checkoutType: "buy" | "sell";
  manualTransferSettings: ManualTransferSettings | null;
}

export function PaymentMethodsSelector({
  selectedMethod,
  onSelectMethod,
  checkoutType,
  manualTransferSettings,
}: PaymentMethodsSelectorProps) {
  const methods = PAYMENT_METHODS.filter((method) => {
    if (checkoutType !== "buy") return method.id !== "manual_transfer";
    if (!manualTransferSettings) return method.id !== "manual_transfer";
    if (method.id === "mercado_pago") return manualTransferSettings.mercadoPagoEnabled;
    if (method.id === "paypal") return manualTransferSettings.paypalEnabled;
    if (method.id === "nowpayments") return manualTransferSettings.nowpaymentsEnabled;
    if (method.id === "manual_transfer") return manualTransferSettings.manualTransferEnabled;
    return true;
  });

  return (
    <section className="bg-card border border-white/5 rounded-3xl p-6 md:p-8">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-accent rounded-full" />
        1. Selecciona Método de Pago / Cobro
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.length === 0 && (
          <div className="md:col-span-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
            <p className="text-[10px] font-black uppercase tracking-wider">
              No hay métodos de pago habilitados. Contactá al soporte o intentá más tarde.
            </p>
          </div>
        )}

        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`
                text-left flex flex-col justify-between p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 relative overflow-hidden group cursor-pointer
                ${method.color}
                ${isSelected ? 'border-accent shadow-[0_0_25px_rgba(217,70,239,0.15)] ring-1 ring-accent' : ''}
              `}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                  {method.icon}
                </div>
                <span className="text-[9px] font-black tracking-widest bg-white/5 px-2 py-0.5 rounded text-white/60">
                  {method.badge}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider mb-1">{method.name}</h3>
                <p className="text-[10px] text-[#84849b] font-medium leading-relaxed">{method.description}</p>
              </div>
              
              {/* Selected Indicator */}
              {isSelected && (
                <span className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
