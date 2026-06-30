import React from 'react';
import { CheckoutFormData, FormErrors, ManualTransferSettings } from '../../domain/types';
import { PAYMENT_METHODS } from '../../domain/constants';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { AdminSelect } from '@/shared/components/AdminSelect';

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
  const { t } = useI18n();

  const getNetworkOptions = React.useCallback(() => {
    if (selectedMethod === "ethereum") {
      return [
        { value: "ERC20", label: t("checkout.network.ethereumMainnet") },
        { value: "BSC", label: t("checkout.network.bnbSmartChain") },
        { value: "Polygon", label: t("checkout.network.polygonPos") },
        { value: "Arbitrum", label: t("checkout.network.arbitrumOne") },
      ];
    } else if (selectedMethod === "nowpayments") {
      return [
        { value: "TRC20", label: t("checkout.network.usdtTrc20Recommended") },
        { value: "BSC", label: t("checkout.network.usdtBnbSmartChain") },
        { value: "ERC20", label: t("checkout.network.usdtEthereum") },
        { value: "BTC", label: t("checkout.network.bitcoin") },
        { value: "LTC", label: t("checkout.network.litecoin") },
      ];
    } else {
      return [
        { value: "BinancePay", label: t("checkout.network.binancePayInstant") },
        { value: "TRC20", label: t("checkout.network.tron") },
        { value: "BSC", label: t("checkout.network.bnbSmartChain") },
        { value: "ERC20", label: t("checkout.network.ethereum") },
      ];
    }
  }, [selectedMethod, t]);

  const networkOptions = getNetworkOptions();

  React.useEffect(() => {
    const opts = getNetworkOptions();
    if (opts.length > 0 && !opts.some(o => o.value === formData.network)) {
      onFormChange({
        ...formData,
        network: opts[0].value
      });
    }
  }, [selectedMethod]);
  
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
  const selectedMethodName = selectedMethodObj
    ? t(`paymentMethod.${selectedMethodObj.id}.name`)
    : selectedMethod;

  return (
    <section id="checkout-form-section" className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 scroll-mt-24">
      <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
        <span className="w-1.5 h-4 bg-accent rounded-full" />
        2. {checkoutType === "buy" ? t("checkout.billingData") : t("checkout.payoutData")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.firstName")}</label>
          <input
            type="text"
            placeholder={t("checkout.firstNamePlaceholder")}
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.firstName ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.firstName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.firstName}</span>}
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.lastName")}</label>
          <input
            type="text"
            placeholder={t("checkout.lastNamePlaceholder")}
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.lastName ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.lastName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.lastName}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.email")}</label>
          <input
            type="email"
            placeholder={t("checkout.emailPlaceholder")}
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.email ? 'border-red-500/50' : 'border-white/8'}`}
          />
          {formErrors.email && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.email}</span>}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.phone")}</label>
          <input
            type="tel"
            placeholder={t("checkout.phonePlaceholder")}
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
              {t("checkout.manualTransferPayment")}
            </h3>
            <p className="text-[10px] text-[#84849b] mt-0.5">
              {t("checkout.manualTransferInstructions")}
            </p>
          </div>

          {!manualTransferSettings?.manualTransferEnabled && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-200 font-bold uppercase tracking-wider">
              {t("checkout.manualTransferDisabled")}
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
              {t("checkout.bank")}
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
              {t("checkout.cryptoShort")}
            </button>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
            {formData.manualTransferType === "bank" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">Alias</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualBankAlias || t("admin.settings.notConfigured")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">CBU / CVU</span>
                    <span className="font-mono font-bold text-white break-all">{manualTransferSettings?.manualBankCbu || t("admin.settings.notConfigured")}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">{t("checkout.holder")}</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualBankHolder || t("admin.settings.notConfigured")}</span>
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
                    <span className="font-mono font-bold text-white break-all">{manualTransferSettings?.manualCryptoAddress || t("admin.settings.notConfigured")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] uppercase font-black block">{t("checkout.network")}</span>
                    <span className="font-bold text-white break-all">{manualTransferSettings?.manualCryptoNetwork || t("admin.settings.notConfigured")}</span>
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
              {t("checkout.requiredProof")}
            </span>
            <span className="block mt-1 text-xs font-bold text-white/80 truncate">
              {formData.paymentProof
                ? `${formData.paymentProof.name} (${(formData.paymentProof.size / 1024 / 1024).toFixed(2)} MB)`
                : t("checkout.proofFormats")}
            </span>
          </label>

          {formData.paymentProof && (
            <button
              type="button"
              onClick={() => updatePaymentProof(null)}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              {t("checkout.removeProof")}
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
              {t("checkout.paymentRecipient")} ({selectedMethodName})
            </h3>
            <p className="text-[10px] text-[#84849b] mt-0.5">{t("checkout.payoutChannelDescription")}</p>
          </div>

          {(selectedMethod === "mercado_pago" || selectedMethod === "paypal") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                  {selectedMethod === "mercado_pago" ? t("checkout.destinationAlias") : t("checkout.paypalEmail")}
                </label>
                <input
                  type="text"
                  placeholder={selectedMethod === "mercado_pago" ? t("checkout.destinationAliasPlaceholder") : t("checkout.paypalEmailPlaceholder")}
                  value={formData.cbu}
                  onChange={(e) => updateField("cbu", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.cbu ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.cbu && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.cbu}</span>}
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.accountHolder")}</label>
                <input
                  type="text"
                  placeholder={t("checkout.accountHolderPlaceholder")}
                  value={formData.accountHolder}
                  onChange={(e) => updateField("accountHolder", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.accountHolder ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.accountHolder && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.accountHolder}</span>}
              </div>

              {selectedMethod === "mercado_pago" && (
                <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.beneficiaryTaxId")}</label>
                  <input
                    type="text"
                    placeholder={t("checkout.beneficiaryTaxIdPlaceholder")}
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
                    ? t("checkout.ethereumWallet")
                    : selectedMethod === "nowpayments"
                      ? t("checkout.cryptoWallet")
                      : t("checkout.depositAddress")}
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedMethod === "ethereum" 
                      ? t("checkout.ethereumWalletPlaceholder") 
                      : selectedMethod === "nowpayments"
                        ? t("checkout.cryptoWalletPlaceholder")
                        : t("checkout.binanceDepositPlaceholder")
                  }
                  value={formData.walletAddress}
                  onChange={(e) => updateField("walletAddress", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.walletAddress ? 'border-red-500/50' : 'border-white/8'}`}
                />
                {formErrors.walletAddress && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.walletAddress}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("checkout.blockchainNetwork")}</label>
                <AdminSelect
                  value={formData.network}
                  onChange={(val) => updateField("network", val)}
                  options={networkOptions}
                  className="w-full"
                  buttonClassName="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-accent/50 transition-colors flex items-center justify-between gap-2 cursor-pointer font-medium"
                  menuClassName="absolute left-0 top-full mt-2 w-full bg-[#110f1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
                  optionClassName="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
export default CheckoutForm;
