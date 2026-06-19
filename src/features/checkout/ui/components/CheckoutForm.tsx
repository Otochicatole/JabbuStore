import React from 'react';
import { CheckoutFormData, FormErrors, ManualTransferSettings } from '../../domain/types';
import { PAYMENT_METHODS } from '../../domain/constants';

interface CheckoutFormProps {
  checkoutType: "buy" | "sell";
  selectedMethod: string;
  formData: CheckoutFormData;
  onFormChange: (data: CheckoutFormData) => void;
  formErrors: FormErrors;
  manualTransferSettings: ManualTransferSettings | null;
}

export function CheckoutForm({ 
  checkoutType, 
  selectedMethod, 
  formData, 
  onFormChange, 
  formErrors,
  manualTransferSettings,
}: CheckoutFormProps) {
  
  const updateField = (field: keyof CheckoutFormData, value: string) => {
    onFormChange({
      ...formData,
      [field]: value
    });
  };

  const updatePaymentProof = (file: File | null) => {
    onFormChange({
      ...formData,
      paymentProof: file,
    });
  };

  const updateManualTransferType = (value: "bank" | "crypto") => {
    onFormChange({
      ...formData,
      manualTransferType: value,
    });
  };

  const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  return (
    <section id="checkout-form-section" className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 scroll-mt-24">
      <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
        <span className="w-1.5 h-4 bg-accent rounded-full" />
        2. {checkoutType === "buy" ? "Datos Personales y de Facturación" : "Datos Personales y Cuenta de Pago"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Nombre</label>
          <input
            type="text"
            placeholder="Ej. Juan"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.firstName ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.firstName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.firstName}</span>}
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Apellido</label>
          <input
            type="text"
            placeholder="Ej. Pérez"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.lastName ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.lastName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.lastName}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Correo Electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.email ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.email && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.email}</span>}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Teléfono de Contacto</label>
          <input
            type="tel"
            placeholder="Ej. +54 9 11 1234 5678"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.phone ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.phone && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.phone}</span>}
        </div>
      </div>

      {checkoutType === "buy" && selectedMethod === "manual_transfer" && (
        <div className="border-t border-white/5 pt-6 mt-6 space-y-5">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Pago por Transferencia Manual
            </h3>
            <p className="text-[10px] text-[#84849b] mt-0.5">
              Elegí banco o cripto, realizá la transferencia y adjuntá el comprobante para enviar la orden a revisión.
            </p>
          </div>

          {!manualTransferSettings?.manualTransferEnabled && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-200 font-bold uppercase tracking-wider">
              La transferencia manual no está habilitada por el admin.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateManualTransferType("bank")}
              className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                formData.manualTransferType === "bank"
                  ? "border-accent bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Bancaria
            </button>
            <button
              type="button"
              onClick={() => updateManualTransferType("crypto")}
              className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                formData.manualTransferType === "crypto"
                  ? "border-accent bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Cripto
            </button>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
            {formData.manualTransferType === "bank" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">Alias</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualBankAlias || "No configurado"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">CBU / CVU</span>
                    <span className="font-mono font-bold text-white break-all">{manualTransferSettings?.manualBankCbu || "No configurado"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">Titular</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualBankHolder || "No configurado"}</span>
                  </div>
                </div>
                {manualTransferSettings?.manualBankInstructions && (
                  <p className="text-[10px] text-[#84849b] leading-relaxed whitespace-pre-line">
                    {manualTransferSettings.manualBankInstructions}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">Wallet</span>
                    <span className="font-mono font-bold text-white break-all">{manualTransferSettings?.manualCryptoAddress || "No configurado"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">Red</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualCryptoNetwork || "No configurado"}</span>
                  </div>
                </div>
                {manualTransferSettings?.manualCryptoInstructions && (
                  <p className="text-[10px] text-[#84849b] leading-relaxed whitespace-pre-line">
                    {manualTransferSettings.manualCryptoInstructions}
                  </p>
                )}
              </>
            )}
          </div>

          <label className={`block rounded-xl border border-dashed p-4 transition-colors cursor-pointer ${
            formErrors.paymentProof
              ? "border-red-500/50 bg-red-500/5"
              : "border-white/10 bg-white/[0.02] hover:border-accent/40"
          }`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="sr-only"
              onChange={(event) => updatePaymentProof(event.target.files?.[0] ?? null)}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">
              Adjuntar comprobante obligatorio
            </span>
            <span className="block mt-1 text-xs font-bold text-white/80 truncate">
              {formData.paymentProof
                ? `${formData.paymentProof.name} (${(formData.paymentProof.size / 1024 / 1024).toFixed(2)} MB)`
                : "JPG, PNG, WEBP, GIF o PDF hasta 10 MB"}
            </span>
          </label>

          {formData.paymentProof && (
            <button
              type="button"
              onClick={() => updatePaymentProof(null)}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              Quitar comprobante
            </button>
          )}

          {formErrors.paymentProof && (
            <span className="block text-[10px] text-red-400 font-bold uppercase">
              {formErrors.paymentProof}
            </span>
          )}
        </div>
      )}

      {/* Dynamic payout inputs for Sell orders */}
      {checkoutType === "sell" && (
        <div className="border-t border-white/5 pt-6 mt-6 space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Destinatario del Pago ({selectedMethodObj?.name})
            </h3>
            <p className="text-[10px] text-[#84849b] mt-0.5">Ingresa los datos del canal donde deseas que enviemos los fondos de tu venta.</p>
          </div>

          {(selectedMethod === "mercado_pago" || selectedMethod === "paypal") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                  {selectedMethod === "mercado_pago" ? "CBU / CVU o Alias de Destino" : "Dirección de Correo PayPal"}
                </label>
                <input
                  type="text"
                  placeholder={selectedMethod === "mercado_pago" ? "Ej. 0000003100012345678901 o alias.mp" : "ejemplo@paypal.com"}
                  value={formData.cbu}
                  onChange={(e) => updateField("cbu", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.cbu ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.cbu && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.cbu}</span>}
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Nombre y Apellido del Titular</label>
                <input
                  type="text"
                  placeholder="Como figura en la cuenta"
                  value={formData.accountHolder}
                  onChange={(e) => updateField("accountHolder", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.accountHolder ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.accountHolder && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.accountHolder}</span>}
              </div>

              {selectedMethod === "mercado_pago" && (
                <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">CUIL / CUIT del Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej. 20-35123456-9"
                    value={formData.cuil}
                    onChange={(e) => updateField("cuil", e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.cuil ? 'border-red-500/50' : 'border-white/8'}`}
                  />
                  {formErrors.cuil && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.cuil}</span>}
                </div>
              )}
            </div>
          )}

          {(selectedMethod === "ethereum" || selectedMethod === "binance" || selectedMethod === "nowpayments") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                  {selectedMethod === "ethereum" 
                    ? "Dirección de Billetera Ethereum / Web3" 
                    : selectedMethod === "nowpayments"
                      ? "Dirección de Billetera Crypto (USDT, BTC, etc.)"
                      : "Dirección de Depósito / Pay ID"}
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedMethod === "ethereum" 
                      ? "Ej. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
                      : selectedMethod === "nowpayments"
                        ? "Ej. Dirección USDT o tu billetera de preferencia"
                        : "Ej. Pay ID 4819401 o wallet address"
                  }
                  value={formData.walletAddress}
                  onChange={(e) => updateField("walletAddress", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.walletAddress ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.walletAddress && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.walletAddress}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Red Blockchain de Depósito</label>
                <select
                  value={formData.network}
                  onChange={(e) => updateField("network", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-accent/50 transition-colors [&>option]:bg-[#0c0a15] [&>option]:text-white cursor-pointer"
                >
                  {selectedMethod === "ethereum" ? (
                    <>
                      <option value="ERC20">Ethereum Mainnet (ERC20)</option>
                      <option value="BSC">BNB Smart Chain (BEP20)</option>
                      <option value="Polygon">Polygon POS (ERC20)</option>
                      <option value="Arbitrum">Arbitrum One (ERC20)</option>
                    </>
                  ) : selectedMethod === "nowpayments" ? (
                    <>
                      <option value="TRC20">USDT (TRC20) — Recomendado</option>
                      <option value="BSC">USDT BNB Smart Chain (BEP20)</option>
                      <option value="ERC20">USDT Ethereum (ERC20)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="LTC">Litecoin (LTC)</option>
                    </>
                  ) : (
                    <>
                      <option value="BinancePay">Binance Pay (Instantáneo)</option>
                      <option value="TRC20">TRON Network (TRC20)</option>
                      <option value="BSC">BNB Smart Chain (BEP20)</option>
                      <option value="ERC20">Ethereum Network (ERC20)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
export default CheckoutForm;
