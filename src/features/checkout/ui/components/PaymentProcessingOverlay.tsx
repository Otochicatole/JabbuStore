import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface PaymentProcessingOverlayProps {
  selectedMethodName: string;
  paymentStep: number;
  checkoutType: "buy" | "sell";
}

export function PaymentProcessingOverlay({
  selectedMethodName,
  paymentStep,
  checkoutType,
}: PaymentProcessingOverlayProps) {
  const steps =
    checkoutType === "buy"
      ? [
          "Validando orden, stock y precios...",
          `Creando enlace seguro con ${selectedMethodName}...`,
          "Redirigiendo para completar el pago...",
        ]
      : [
          "Validando artículos y datos de cobro...",
          "Registrando la orden de venta...",
          "Preparando seguimiento de la operación...",
        ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-[#0c0a15] border border-white/5 p-10 rounded-3xl max-w-md w-full mx-6 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent/5 filter blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
            <Loader2 className="absolute inset-0 w-14 h-14 animate-spin text-accent" />
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              {checkoutType === "buy" ? "Preparando Pago Seguro" : "Registrando Venta"}
            </h3>
            <p className="text-[11px] text-[#84849b] font-semibold mt-2 leading-relaxed">
              {checkoutType === "buy"
                ? "Estamos creando una orden real y validada por el servidor."
                : "Estamos validando tus artículos antes de generar la orden."}
            </p>
          </div>

          <div className="space-y-4 text-left max-w-xs mx-auto text-xs">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = paymentStep === stepNumber;
              const isComplete = paymentStep > stepNumber;
              const isVisible = paymentStep >= stepNumber;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 transition-colors ${
                    isVisible ? "text-white" : "text-white/20"
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isComplete
                        ? "bg-emerald-400"
                        : isActive
                          ? "bg-accent animate-pulse"
                          : "bg-white/10"
                    }`}
                  />
                  <span className="font-bold uppercase tracking-wider">{step}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-[#84849b] font-bold uppercase tracking-widest leading-relaxed">
            Por favor no cierres esta pestaña.
            <br />
            {checkoutType === "buy"
              ? "Te redirigiremos al proveedor de pago."
              : "Te llevaremos al seguimiento de tus órdenes."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentProcessingOverlay;
