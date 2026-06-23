import React from 'react';
import { DollarSign, ArrowRight } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface OrderSummaryProps {
  itemsCount: number;
  totalPrice: number;
  selectedMethod: string | null;
  isProcessingPayment: boolean;
  checkoutType: "buy" | "sell";
  onSubmit: () => void;
}

export function OrderSummary({
  itemsCount,
  totalPrice,
  selectedMethod,
  isProcessingPayment,
  checkoutType,
  onSubmit
}: OrderSummaryProps) {
  const { t } = useI18n();

  return (
    <div className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">{t("checkout.summary")}</h2>

      <div className="space-y-4 font-sans border-b border-white/5 pb-6 mb-6">
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>{t("common.subtotal")} ({itemsCount} {t("common.items")})</span>
          <span className="text-white">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>{t("checkout.gatewayFee")}</span>
          <span className="text-emerald-400">{t("checkout.included")}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
          <span>{t("checkout.orderValidation")}</span>
          <span className="text-emerald-400">Server-side</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.finalAmount")}</span>
          <span className="text-2xl font-black text-white block tracking-tighter mt-1">${totalPrice.toFixed(2)} USD</span>
        </div>
        <div className="p-3 bg-accent/10 rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-accent" />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!selectedMethod || isProcessingPayment}
        className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_0_35px_rgba(217,70,239,0.35)] hover:shadow-[0_0_45px_rgba(217,70,239,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {checkoutType === "buy"
          ? selectedMethod === "manual_transfer"
            ? t("checkout.createManualOrder")
            : t("checkout.continueSecurePayment")
          : t("checkout.confirmSale")}
        <ArrowRight className="w-4 h-4" />
      </button>

      {!selectedMethod && (
        <p className="text-[9px] text-center text-[#84849b] mt-4 font-bold uppercase tracking-wider">
          {t("checkout.selectPaymentAbove")}
        </p>
      )}
    </div>
  );
}
export default OrderSummary;
