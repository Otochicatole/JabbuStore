import React from 'react';
import { DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { PaymentQuote } from '../../domain/types';

interface OrderSummaryProps {
  itemsCount: number;
  totalPrice: number;
  selectedMethod: string | null;
  isProcessingPayment: boolean;
  checkoutType: "buy" | "sell";
  paymentQuote: PaymentQuote | null;
  paymentQuoteLoading: boolean;
  paymentQuoteError: string | null;
  manualTransferType: "bank" | "crypto";
  onSubmit: () => void;
}

export function OrderSummary({
  itemsCount,
  totalPrice,
  selectedMethod,
  isProcessingPayment,
  checkoutType,
  paymentQuote,
  paymentQuoteLoading,
  paymentQuoteError,
  manualTransferType,
  onSubmit
}: OrderSummaryProps) {
  const { t } = useI18n();
  const requiresArsQuote =
    checkoutType === "buy" &&
    (selectedMethod === "mercado_pago" ||
      (selectedMethod === "manual_transfer" && manualTransferType === "bank"));
  const arsQuote = paymentQuote?.settlement.currency === "ARS" ? paymentQuote : null;
  const cryptoQuote = paymentQuote?.settlement.currency === "USDT" ? paymentQuote : null;
  const finalAmountLabel = arsQuote
    ? `${formatArs(arsQuote.settlement.amount)} ARS`
    : cryptoQuote
      ? `${cryptoQuote.settlement.amount.toFixed(2)} USDT`
      : `$${totalPrice.toFixed(2)} USD`;

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
        {requiresArsQuote && paymentQuoteLoading && (
          <div className="flex items-center justify-between gap-3 text-xs text-[#84849b] font-semibold">
            <span>{t("checkout.paymentQuote")}</span>
            <span className="inline-flex items-center gap-1 text-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("checkout.updatingQuote")}
            </span>
          </div>
        )}
        {requiresArsQuote && paymentQuoteError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[10px] font-bold uppercase tracking-wider text-red-200">
            {paymentQuoteError}
          </div>
        )}
        {arsQuote && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="text-[#84849b]">{t("checkout.exchangeRate")}</span>
              <span className="text-white text-right">
                {t(`checkout.rateKind.${arsQuote.rate?.kind || "blue"}`)} · {formatArs(arsQuote.rate?.value || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="text-[#84849b]">{t("checkout.payInArs")}</span>
              <span className="text-emerald-400 text-right font-black">
                {formatArs(arsQuote.settlement.amount)} ARS
              </span>
            </div>
            {arsQuote.expiresAt && (
              <p className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
                {t("checkout.quoteExpiresAt", {
                  time: new Date(arsQuote.expiresAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.finalAmount")}</span>
          <span className="text-2xl font-black text-white block tracking-tighter mt-1">{finalAmountLabel}</span>
          {arsQuote && (
            <span className="text-[10px] font-bold text-[#84849b] block mt-1">
              {t("checkout.baseAmountUsd", { amount: totalPrice.toFixed(2) })}
            </span>
          )}
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

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
