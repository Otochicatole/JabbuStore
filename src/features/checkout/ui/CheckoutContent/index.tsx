"use client";

import React from "react";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { PAYMENT_METHODS } from "../../domain/constants";
import { PaymentMethodsSelector } from "./PaymentMethodsSelector";
import { CheckoutForm } from "./CheckoutForm";
import { ItemsReview } from "./ItemsReview";
import { OrderSummary } from "./OrderSummary";
import { SuccessScreen } from "./SuccessScreen";
import { PaymentProcessingOverlay } from "./PaymentProcessingOverlay";
import { useCheckout } from "./useCheckout";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

export function CheckoutContent() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const {
    checkoutType,
    items,
    totalPrice,
    loading,
    error,
    selectedMethod,
    setSelectedMethod,
    isProcessingPayment,
    paymentStep,
    isSuccess,
    createdOrderId,
    formData,
    setFormData,
    formErrors,
    manualTransferSettings,
    handleSubmitCheckout,
    router,
  } = useCheckout();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510]">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">
          {t("checkout.validatingPrices")}
        </p>
      </div>
    );
  }

  if (error && !isProcessingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510] px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-red-500/5 border border-red-500/10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">
            {t("checkout.validationError")}
          </h2>
          <p className="text-sm text-[#84849b] mb-6">{error}</p>
          <Link
            href={localizePath(checkoutType === "buy" ? "/buy" : "/sell")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("checkout.backToStore")}
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <SuccessScreen
        checkoutType={checkoutType}
        createdOrderId={createdOrderId}
        paymentMethod={selectedMethod}
        onNavigateToOrders={() => router.push(localizePath("/purchases"))}
        onNavigateToHome={() => router.push(localizePath("/"))}
      />
    );
  }

  const selectedMethodObj = PAYMENT_METHODS.find(
    (m) => m.id === selectedMethod,
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans">
      {/* Header */}
      <div className="mb-10">
        <Link
          href={localizePath(checkoutType === "buy" ? "/buy" : "/sell")}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t("common.back")}{" "}
          {checkoutType === "buy" ? t("nav.buy") : t("nav.sell")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
          {t("checkout.title")}{" "}
          <span className="text-accent">
            {checkoutType === "buy" ? t("nav.buy") : t("nav.sell")}
          </span>
        </h1>
        <p className="text-sm text-[#84849b] mt-1">
          {t("checkout.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        {/* Left Side: Selector & Forms */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-8 min-w-0">
          <PaymentMethodsSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
            checkoutType={checkoutType}
            manualTransferSettings={manualTransferSettings}
          />

          {selectedMethod && (
            <CheckoutForm
              checkoutType={checkoutType}
              selectedMethod={selectedMethod}
              formData={formData}
              onFormChange={setFormData}
              formErrors={formErrors}
              manualTransferSettings={manualTransferSettings}
            />
          )}

          <ItemsReview items={items} selectedMethod={selectedMethod} />
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 min-w-0">
          <OrderSummary
            itemsCount={items.length}
            totalPrice={totalPrice}
            selectedMethod={selectedMethod}
            isProcessingPayment={isProcessingPayment}
            checkoutType={checkoutType}
            onSubmit={handleSubmitCheckout}
          />
          {checkoutType === "buy" && !selectedMethod && (
            <p className="mt-3 text-[10px] text-red-300 font-bold uppercase tracking-wider text-center">
              {t("checkout.noPaymentMethods")}
            </p>
          )}
        </div>
      </div>

      {/* Secure payment processing overlay */}
      {isProcessingPayment && selectedMethodObj && (
        <PaymentProcessingOverlay
          selectedMethodName={t(`paymentMethod.${selectedMethodObj.id}.name`)}
          paymentStep={paymentStep}
          checkoutType={checkoutType}
        />
      )}
    </main>
  );
}
export default CheckoutContent;
