"use client";

import React, { useState } from "react";
import { CreditCard, ExternalLink, Copy, Check, FileText } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import { Order } from "../../../domain/types";

interface OrderDetailPayoutDetailsProps {
  order: Order;
  onOpenProofModal: () => void;
}

export function OrderDetailPayoutDetails({
  order,
  onOpenProofModal,
}: OrderDetailPayoutDetailsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopyTradeLink = (tradeLink: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const isManualTransfer = order.paymentMethod === "manual_transfer";
  const manualTransferSnapshot = order.metadata?.manualTransferSnapshot;
  const buyerProof = order.metadata?.buyerPaymentProof || null;
  const buyerProofUrl = buyerProof
    ? `${BACKEND_URL}/orders/${order.id}/payment-proof`
    : null;

  return (
    <div className="mb-6 bg-white/[0.01] border border-white/5 p-5 space-y-4 rounded-[3px]">
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <CreditCard className="w-4 h-4 text-[#84849b]" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
          {t("admin.sellOrders.paymentDestinationData")}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Columna 1: Datos Personales */}
        <div className="space-y-2.5">
          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
            {t("admin.orders.customerDetails")}
          </h5>
          <div className="space-y-2 bg-[#110f1e]/40 p-3 border border-white/5 rounded-[3px]">
            <div>
              <span className="text-[8.5px] text-[#84849b] uppercase block">
                {t("admin.orders.fullName")}
              </span>
              <span className="font-extrabold text-white block mt-0.5">
                {order.metadata?.firstName || order.metadata?.lastName
                  ? `${order.metadata.firstName || ""} ${order.metadata.lastName || ""}`.trim()
                  : order.user?.name || t("common.notSpecified")}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-[#84849b] uppercase block">
                {t("admin.orders.email")}
              </span>
              <span className="font-bold text-white block mt-0.5 break-all select-all font-mono">
                {order.metadata?.email || t("common.notSpecified")}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-[#84849b] uppercase block">
                {t("purchases.phone")}
              </span>
              <span className="font-bold font-mono text-[9.5px] text-white block mt-0.5 select-all">
                {order.metadata?.phone || t("common.notSpecified")}
              </span>
            </div>
          </div>
        </div>

        {/* Columna 2: Método de Cobro */}
        <div className="space-y-2.5">
          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
            Detalle del Cobro
          </h5>
          <div className="space-y-2 bg-[#110f1e]/40 p-3 border border-white/5 min-h-[120px] rounded-[3px]">
            <div>
              <span className="text-[8.5px] text-[#84849b] uppercase block">
                {t("admin.orders.paymentMethod")}
              </span>
              <span className="font-black text-accent block mt-0.5 uppercase tracking-wide">
                {order.paymentMethod === "mercado_pago"
                  ? t("paymentMethod.mercado_pago.name")
                  : order.paymentMethod === "paypal"
                    ? "PayPal"
                    : order.paymentMethod === "manual_transfer"
                      ? t("paymentMethod.manual_transfer.name")
                      : order.paymentMethod === "ethereum"
                        ? "Ethereum (Web3)"
                        : order.paymentMethod === "binance"
                          ? "Binance Pay"
                          : order.paymentMethod || t("common.notSpecified")}
              </span>
            </div>

            {order.paymentMethod === "nowpayments" && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                {order.metadata?.nowpaymentsPaymentId && (
                  <div className="mb-2">
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.nowpaymentsPaymentId")}
                    </span>
                    <span className="font-bold font-mono text-purple-400 block select-all bg-purple-500/10 p-1.5 rounded-[3px] border border-purple-500/20 mt-0.5 shadow-[0_0_10px_rgba(168,85,247,0.05)]">
                      {order.metadata.nowpaymentsPaymentId}
                    </span>
                  </div>
                )}
                {order.type === "SELL" ||
                order.type === "sell" ||
                order.type?.toUpperCase() === "SELL" ? (
                  <>
                    <div>
                      <span className="text-[8.5px] text-[#84849b] block">
                        {t("admin.orders.cryptoDestinationWallet")}
                      </span>
                      <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                        {order.metadata?.walletAddress || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-[#84849b] block">
                        {t("admin.orders.blockchainNetwork")}
                      </span>
                      <span className="font-bold text-white block">
                        {order.metadata?.network || "N/A"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[9.5px] text-[#84849b] italic">
                      {t("admin.orders.nowpaymentsCaptured")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.paymentMethod === "mercado_pago" && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                {order.metadata?.mpPaymentId && (
                  <div className="mb-2">
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.mpOperationId")}
                    </span>
                    <span className="font-bold font-mono text-emerald-400 block select-all bg-emerald-500/10 p-1.5 rounded-[3px] border border-emerald-500/20 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                      {order.metadata.mpPaymentId}
                    </span>
                  </div>
                )}
                {order.type === "SELL" ||
                order.type === "sell" ||
                order.type?.toUpperCase() === "SELL" ? (
                  <>
                    <div>
                      <span className="text-[8.5px] text-[#84849b] block">
                        {t("admin.orders.destinationBankAccount")}
                      </span>
                      <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                        {order.metadata?.cbu || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          {t("admin.orders.accountHolder")}
                        </span>
                        <span className="font-bold text-white block">
                          {order.metadata?.accountHolder || "N/A"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] text-[#84849b] block">
                          CUIL / CUIT
                        </span>
                        <span className="font-bold font-mono text-white block select-all">
                          {order.metadata?.cuil || "N/A"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[9.5px] text-[#84849b] italic">
                      {t("admin.orders.mercadoPagoCaptured")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.paymentMethod === "paypal" && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                {order.metadata?.paypalPaymentId && (
                  <div className="mb-2">
                    <span className="text-[8.5px] text-[#84849b] block">
                      ID de Captura PayPal
                    </span>
                    <span className="font-bold font-mono text-indigo-400 block select-all bg-indigo-500/10 p-1.5 rounded-[3px] border border-indigo-500/20 mt-0.5 shadow-[0_0_10px_rgba(99,102,241,0.05)]">
                      {order.metadata.paypalPaymentId}
                    </span>
                  </div>
                )}
                {order.type === "SELL" ||
                order.type === "sell" ||
                order.type?.toUpperCase() === "SELL" ? (
                  <>
                    <div>
                      <span className="text-[8.5px] text-[#84849b] block">
                        {t("admin.orders.destinationPaypalEmail")}
                      </span>
                      <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                        {order.metadata?.cbu || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-[#84849b] block">
                        {t("admin.orders.paypalHolder")}
                      </span>
                      <span className="font-bold text-white block">
                        {order.metadata?.accountHolder || "N/A"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[9.5px] text-[#84849b] italic">
                      {t("admin.orders.paypalCaptured")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(order.paymentMethod === "ethereum" ||
              order.paymentMethod === "binance") && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                <div>
                  <span className="text-[8.5px] text-[#84849b] block">
                    {t("admin.orders.destinationWallet")}
                  </span>
                  <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                    {order.metadata?.walletAddress || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-[#84849b] block">
                    {t("admin.orders.blockchainNetwork")}
                  </span>
                  <span className="font-bold text-white block">
                    {order.metadata?.network || "N/A"}
                  </span>
                </div>
              </div>
            )}

            {!order.paymentMethod && (
              <p className="text-[9.5px] text-white/30 italic mt-2">
                {t("admin.orders.noExternalPaymentDetails")}
              </p>
            )}
          </div>
        </div>

        {/* Columna 3: Steam Trade Link */}
        <div className="space-y-2.5">
          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
            {t("admin.orders.tradeConsole")}
          </h5>
          <div className="space-y-3 bg-[#110f1e]/40 p-3 border border-white/5 min-h-[120px] flex flex-col justify-between rounded-[3px]">
            <div>
              <span className="text-[8.5px] text-[#84849b] uppercase block font-semibold">
                {t("admin.orders.customerTradeLink")}
              </span>
              <span className="font-mono text-[9.5px] text-white/80 block mt-1 break-all select-all leading-normal">
                {order.user?.tradeUrl || t("admin.common.noTradeUrl")}
              </span>
            </div>

            {order.user?.tradeUrl && (
              <div className="flex gap-2">
                <a
                  href={order.user.tradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-8 flex items-center justify-center gap-1.5 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9.5px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer rounded-[3px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("admin.orders.openTrade")}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    order.user?.tradeUrl &&
                    handleCopyTradeLink(order.user.tradeUrl)
                  }
                  className={`h-8 px-3 flex items-center justify-center gap-1.5 border text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-[3px] ${
                    copied
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "bg-white/5 border-white/5 text-[#84849b] hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t("admin.orders.copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t("admin.orders.copy")}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/5">
        {isManualTransfer && (
          <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[3px]">
            <h5 className="text-[9px] font-black uppercase text-emerald-300 tracking-wider font-mono mb-2">
              {t("paymentMethod.manual_transfer.name")}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
              {manualTransferSnapshot?.type === "crypto" ? (
                <>
                  <div className="sm:col-span-2">
                    <span className="text-[#84849b] uppercase block">Wallet</span>
                    <span className="font-mono font-bold text-white break-all">
                      {manualTransferSnapshot.crypto?.address || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#84849b] uppercase block">
                      {t("purchases.network")}
                    </span>
                    <span className="font-bold text-white">
                      {manualTransferSnapshot.crypto?.network || "N/A"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[#84849b] uppercase block">Alias</span>
                    <span className="font-bold text-white break-all">
                      {manualTransferSnapshot?.bank?.alias || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#84849b] uppercase block">CBU / CVU</span>
                    <span className="font-mono font-bold text-white break-all">
                      {manualTransferSnapshot?.bank?.cbu || "N/A"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#84849b] uppercase block">
                      {t("purchases.holder")}
                    </span>
                    <span className="font-bold text-white">
                      {manualTransferSnapshot?.bank?.holder || "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono mb-2">
          {t("admin.orders.buyerProofTitle")}
        </h5>
        {buyerProof ? (
          <button
            type="button"
            onClick={onOpenProofModal}
            className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-[3px] hover:bg-emerald-500/15 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider">
                {t("purchases.viewProof")}
              </span>
              <span className="block text-[9px] text-emerald-100/70 truncate">
                {buyerProof.fileName || t("purchases.attachedFile")}
              </span>
            </span>
          </button>
        ) : (
          <p className="text-[10px] text-white/30 font-bold">
            {t("admin.orders.noBuyerProof")}
          </p>
        )}
      </div>
    </div>
  );
}
