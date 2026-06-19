"use client";

import React from "react";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { PAYMENT_METHODS } from "../domain/constants";
import { PaymentMethodsSelector } from "./components/PaymentMethodsSelector";
import { CheckoutForm } from "./components/CheckoutForm";
import { ItemsReview } from "./components/ItemsReview";
import { OrderSummary } from "./components/OrderSummary";
import { SuccessScreen } from "./components/SuccessScreen";
import { PaymentProcessingOverlay } from "./components/PaymentProcessingOverlay";
import { useCheckout } from "./useCheckout";

export function CheckoutContent() {
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
    handleSubmitCheckout,
    router,
  } = useCheckout();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510]">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">
          Validando precios con el servidor...
        </p>
      </div>
    );
  }

  if (error && !isProcessingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510] px-6">
        <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">
            Error de Validación
          </h2>
          <p className="text-sm text-[#84849b] mb-6">{error}</p>
          <Link
            href={checkoutType === "buy" ? "/buy" : "/sell"}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
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
        onNavigateToOrders={() => router.push("/purchases")}
        onNavigateToHome={() => router.push("/")}
      />
    );
  }

  const selectedMethodObj = PAYMENT_METHODS.find(
    (m) => m.id === selectedMethod,
  );

  return (
    <main className="mx-auto max-w-7xl px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      {/* Header */}
      <div className="mb-10">
        <Link
          href={checkoutType === "buy" ? "/buy" : "/sell"}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a{" "}
          {checkoutType === "buy" ? "Comprar" : "Vender"}
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          Checkout de{" "}
          <span className="text-accent">
            {checkoutType === "buy" ? "Compra" : "Venta"}
          </span>
        </h1>
        <p className="text-sm text-[#84849b] mt-1">
          Verifica tus artículos y completa la operación con una pasarela de pago segura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Selector & Forms */}
        <div className="lg:col-span-8 space-y-8">
          <PaymentMethodsSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />

          {selectedMethod && (
            <CheckoutForm
              checkoutType={checkoutType}
              selectedMethod={selectedMethod}
              formData={formData}
              onFormChange={setFormData}
              formErrors={formErrors}
            />
          )}

          <ItemsReview items={items} selectedMethod={selectedMethod} />
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-4 sticky top-28">
          <OrderSummary
            itemsCount={items.length}
            totalPrice={totalPrice}
            selectedMethod={selectedMethod}
            isProcessingPayment={isProcessingPayment}
            checkoutType={checkoutType}
            onSubmit={handleSubmitCheckout}
          />
        </div>
      </div>

      {/* Secure payment processing overlay */}
      {isProcessingPayment && selectedMethodObj && (
        <PaymentProcessingOverlay
          selectedMethodName={selectedMethodObj.name}
          paymentStep={paymentStep}
          checkoutType={checkoutType}
        />
      )}
    </main>
  );
}
export default CheckoutContent;
