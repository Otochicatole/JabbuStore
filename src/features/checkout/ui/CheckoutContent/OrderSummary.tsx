import React from 'react';
import { DollarSign, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { PaymentQuote } from '../../domain/types';
import { Money } from '@/features/currency/ui/Money';
import { useCurrency } from '@/features/currency/context/CurrencyContext';

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
  payoutCurrency?: "ARS" | "BRL" | "USD";
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
  payoutCurrency,
  onSubmit
}: OrderSummaryProps) {
  const { t } = useI18n();
  const { effectiveCurrency, formatCurrencyAmount, rates } = useCurrency();
  const requiresArsQuote =
    checkoutType === "buy" &&
    (selectedMethod === "mercado_pago" ||
      (selectedMethod === "manual_transfer" && manualTransferType === "bank"));
  const arsQuote = paymentQuote?.settlement.currency === "ARS" ? paymentQuote : null;
  const cryptoQuote = paymentQuote?.settlement.currency === "USDT" ? paymentQuote : null;
  const settlementCurrency = arsQuote ? "ARS" : cryptoQuote ? "USDT" : "USD";

  const arsRate = rates?.rates.ARS ?? (arsQuote?.rate?.value || 0);
  const brlRate = rates?.rates.BRL ?? 0;

  let finalAmountLabel = "";
  if (checkoutType === "sell" && selectedMethod === "mercado_pago") {
    if (payoutCurrency === "ARS" && arsRate > 0) {
      finalAmountLabel = formatCurrencyAmount(totalPrice * arsRate, "ARS");
    } else if (payoutCurrency === "BRL" && brlRate > 0) {
      finalAmountLabel = formatCurrencyAmount(totalPrice * brlRate, "BRL");
    } else {
      finalAmountLabel = `$${totalPrice.toFixed(2)} USD`;
    }
  } else {
    finalAmountLabel = arsQuote
      ? formatCurrencyAmount(arsQuote.settlement.amount, "ARS")
      : cryptoQuote
        ? `${cryptoQuote.settlement.amount.toFixed(2)} USDT`
        : `$${totalPrice.toFixed(2)} USD`;
  }

  const showQuoteBox = Boolean(rates || arsQuote);

  const formatRate = (value: number, currency: "USD" | "ARS" | "BRL") => {
    const locale = currency === "USD" ? "en-US" : currency === "ARS" ? "es-AR" : "pt-BR";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
      <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">{t("checkout.summary")}</h2>

      <div className="space-y-4 font-sans border-b border-white/5 pb-6 mb-6">
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
        {showQuoteBox && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-3">
            {/* Sección de Cotizaciones */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#84849b] mb-2">
                {t("checkout.exchangeRate")}
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-accent/30">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#84849b]">USD</span>
                  <span className="text-white text-right">1 USD = 1.00 USD</span>
                </div>
                {arsRate > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#84849b]">
                      ARS ({t(`checkout.rateKind.${rates?.usdArsRateKind || arsQuote?.rate?.kind || "blue"}`)})
                    </span>
                    <span className="text-white text-right">
                      1 USD = {formatRate(arsRate, "ARS")} ARS
                    </span>
                  </div>
                )}
                {brlRate > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#84849b]">BR (BRL)</span>
                    <span className="text-white text-right">
                      1 USD = {formatRate(brlRate, "BRL")} BRL
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección de Subtotales */}
            <div className="border-t border-white/5 pt-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#84849b] mb-2">
                {t("common.subtotal")} ({itemsCount} {t("common.items")})
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-emerald-500/30">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#84849b]">USD</span>
                  <span className="text-white text-right">
                    {formatCurrencyAmount(totalPrice, "USD")}
                  </span>
                </div>
                {arsRate > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#84849b]">ARS</span>
                    <span className="text-white text-right">
                      {formatCurrencyAmount(totalPrice * arsRate, "ARS")}
                    </span>
                  </div>
                )}
                {brlRate > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#84849b]">BR (BRL)</span>
                    <span className="text-white text-right">
                      {formatCurrencyAmount(totalPrice * brlRate, "BRL")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Si hay cotización activa en ARS para el pago actual */}
            {arsQuote && (
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#84849b]">{t("checkout.payInArs")}</span>
                  <span className="text-emerald-400 font-black text-right">
                    {formatCurrencyAmount(arsQuote.settlement.amount, "ARS")}
                  </span>
                </div>
                {arsQuote.expiresAt && (
                  <p className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider mt-1">
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
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.finalAmount")}</span>
          <span className="text-2xl font-black text-white block tracking-tighter mt-1">{finalAmountLabel}</span>
          {effectiveCurrency !== settlementCurrency && !showQuoteBox && (
            <span className="block mt-1 text-[10px] font-bold text-accent">
              {t("currency.estimated")}: <Money amountUsd={totalPrice} approximate />
            </span>
          )}
          {arsQuote && !showQuoteBox && (
            <span className="text-[10px] font-bold text-[#84849b] block mt-1">
              {t("checkout.baseAmountUsd", { amount: totalPrice.toFixed(2) })}
            </span>
          )}
        </div>
        <div className="p-3 bg-accent/10 rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-accent" />
        </div>
      </div>

      {checkoutType === "sell" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t("checkout.warning.provisionalQuoteTitle")}</span>
          </div>
          <p className="text-[9.5px] text-[#84849b] leading-relaxed font-bold uppercase tracking-wide">
            {t("checkout.warning.provisionalQuoteDescription")}
          </p>
        </div>
      )}

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
