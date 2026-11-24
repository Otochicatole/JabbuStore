"use client";

import React, { useState } from "react";
import { CreditCard, ExternalLink, Copy, Check, FileText } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Order } from "@/features/admin/domain/types";
import { AdminSection } from "@/features/admin/ui/AdminShell";

interface OrderDetailPayoutDetailsProps {
  order: Order;
  onOpenProofModal: () => void;
  mode?: "all" | "payment" | "buyer";
}

export function getPaymentMethodLabel(
  paymentMethod: string | null | undefined,
  t: (key: string) => string,
) {
  switch (paymentMethod) {
    case "mercado_pago":
      return t("paymentMethod.mercado_pago.name");
    case "paypal":
      return "PayPal";
    case "manual_transfer":
      return t("paymentMethod.manual_transfer.name");
    case "nowpayments":
      return t("paymentMethod.nowpayments.name");
    case "ethereum":
      return "Ethereum (Web3)";
    case "binance":
      return "Binance Pay";
    default:
      return paymentMethod || t("common.notSpecified");
  }
}

export function OrderDetailPayoutDetails({
  order,
  onOpenProofModal,
  mode = "all",
}: OrderDetailPayoutDetailsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopyTradeLink = (tradeLink: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isManualTransfer = order.paymentMethod === "manual_transfer";
  const manualTransferSnapshot = order.metadata?.manualTransferSnapshot;
  const paymentQuote = order.metadata?.paymentQuote;
  const arsQuote =
    paymentQuote?.settlement?.currency === "ARS" &&
    typeof paymentQuote.settlement.amount === "number"
      ? paymentQuote
      : null;
  const buyerProof = order.metadata?.buyerPaymentProof || null;
  const isSellOrder = order.type?.toUpperCase() === "SELL";

  const showBuyer = mode === "all" || mode === "buyer";
  const showPayment = mode === "all" || mode === "payment";
  const showTrade = mode === "all" || mode === "buyer";

  const sectionTitle =
    mode === "buyer"
      ? t("admin.orders.tabs.buyer")
      : isSellOrder
        ? t("admin.sellOrders.paymentDestinationData")
        : t("admin.orders.billingDetails");

  const customerCard = showBuyer && (
    <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 text-xs">
      <h5 className="text-xs font-semibold text-[#c2bdd6]">
        {t("admin.orders.customerDetails")}
      </h5>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <span className="block text-[11px] text-[#8e88a6]">
            {t("admin.orders.fullName")}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-white">
            {order.metadata?.firstName || order.metadata?.lastName
              ? `${order.metadata.firstName || ""} ${order.metadata.lastName || ""}`.trim()
              : order.user?.name || t("common.notSpecified")}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#8e88a6]">
            {t("admin.orders.email")}
          </span>
          <span className="mt-0.5 block break-all font-mono text-white select-all">
            {order.metadata?.email || t("common.notSpecified")}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#8e88a6]">
            {t("purchases.phone")}
          </span>
          <span className="mt-0.5 block font-mono text-white select-all tabular-nums">
            {order.metadata?.phone || t("common.notSpecified")}
          </span>
        </div>
      </div>
    </div>
  );

  const paymentMethodCard = showPayment && (
    <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 text-xs">
      <h5 className="text-xs font-semibold text-[#c2bdd6]">
        {t("admin.orders.payoutDetails")}
      </h5>
      <div>
        <span className="block text-[11px] text-[#8e88a6]">
          {t("admin.orders.paymentMethod")}
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-white">
          {getPaymentMethodLabel(order.paymentMethod, t)}
        </span>
      </div>

      {order.paymentMethod === "nowpayments" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
          {order.metadata?.nowpaymentsPaymentId && (
            <div>
              <span className="block text-[11px] text-[#8e88a6]">
                {t("admin.orders.nowpaymentsPaymentId")}
              </span>
              <span className="mt-0.5 block break-all rounded border border-purple-500/20 bg-purple-500/10 p-1.5 font-mono text-purple-300 select-all">
                {order.metadata.nowpaymentsPaymentId}
              </span>
            </div>
          )}
          {isSellOrder ? (
            <>
              <div>
                <span className="block text-[11px] text-[#8e88a6]">
                  {t("admin.orders.cryptoDestinationWallet")}
                </span>
                <span className="mt-0.5 block break-all rounded border border-white/10 bg-[#0d0a18] p-1.5 font-mono text-white select-all">
                  {order.metadata?.walletAddress || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#8e88a6]">
                  {t("admin.orders.blockchainNetwork")}
                </span>
                <span className="mt-0.5 block font-medium text-white">
                  {order.metadata?.network || "N/A"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-[#9e98b6]">{t("admin.orders.nowpaymentsCaptured")}</p>
          )}
        </div>
      )}

      {order.paymentMethod === "mercado_pago" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
          {order.metadata?.mpPaymentId && (
            <div>
              <span className="block text-[11px] text-[#8e88a6]">
                {t("admin.orders.mpOperationId")}
              </span>
              <span className="mt-0.5 block rounded border border-emerald-500/20 bg-emerald-500/10 p-1.5 font-mono text-emerald-300 select-all">
                {order.metadata.mpPaymentId}
              </span>
            </div>
          )}
          {isSellOrder ? (
            <>
              <div>
                <span className="block text-[11px] text-[#8e88a6]">
                  {t("admin.orders.destinationBankAccount")}
                </span>
                <span className="mt-0.5 block break-all rounded border border-white/10 bg-[#0d0a18] p-1.5 font-mono text-white select-all">
                  {order.metadata?.cbu || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[11px] text-[#8e88a6]">
                    {t("admin.orders.accountHolder")}
                  </span>
                  <span className="font-medium text-white">
                    {order.metadata?.accountHolder || "N/A"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-[#8e88a6]">CUIL / CUIT</span>
                  <span className="font-mono text-white select-all">
                    {order.metadata?.cuil || "N/A"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-[#9e98b6]">{t("admin.orders.mercadoPagoCaptured")}</p>
          )}
        </div>
      )}

      {order.paymentMethod === "paypal" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
          {order.metadata?.paypalPaymentId && (
            <div>
              <span className="block text-[11px] text-[#8e88a6]">
                {t("admin.orders.paypalCaptureId")}
              </span>
              <span className="mt-0.5 block break-all rounded border border-sky-500/20 bg-sky-500/10 p-1.5 font-mono text-sky-300 select-all">
                {order.metadata.paypalPaymentId}
              </span>
            </div>
          )}
          {isSellOrder ? (
            <>
              <div>
                <span className="block text-[11px] text-[#8e88a6]">
                  {t("admin.orders.destinationPaypalEmail")}
                </span>
                <span className="mt-0.5 block break-all rounded border border-white/10 bg-[#0d0a18] p-1.5 font-mono text-white select-all">
                  {order.metadata?.cbu || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#8e88a6]">
                  {t("admin.orders.paypalHolder")}
                </span>
                <span className="font-medium text-white">
                  {order.metadata?.accountHolder || "N/A"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-[#9e98b6]">{t("admin.orders.paypalCaptured")}</p>
          )}
        </div>
      )}

      {(order.paymentMethod === "ethereum" || order.paymentMethod === "binance") && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
          <div>
            <span className="block text-[11px] text-[#8e88a6]">
              {t("admin.orders.destinationWallet")}
            </span>
            <span className="mt-0.5 block break-all rounded border border-white/10 bg-[#0d0a18] p-1.5 font-mono text-white select-all">
              {order.metadata?.walletAddress || "N/A"}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-[#8e88a6]">
              {t("admin.orders.blockchainNetwork")}
            </span>
            <span className="font-medium text-white">{order.metadata?.network || "N/A"}</span>
          </div>
        </div>
      )}

      {!order.paymentMethod && (
        <p className="text-xs text-[#746e8d]">{t("admin.orders.noExternalPaymentDetails")}</p>
      )}
    </div>
  );

  const tradeLinkCard = showTrade && (
    <div className="flex flex-col justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 text-xs">
      <div>
        <h5 className="text-xs font-semibold text-[#c2bdd6]">
          {t("admin.orders.tradeConsole")}
        </h5>
        <span className="mt-2 block text-[11px] text-[#8e88a6]">
          {t("admin.orders.customerTradeLink")}
        </span>
        <span className="mt-1 block break-all rounded-md border border-white/[0.06] bg-[#0d0a18] p-2.5 font-mono text-xs text-white/90 select-all leading-relaxed">
          {order.user?.tradeUrl || t("admin.common.noTradeUrl")}
        </span>
      </div>

      {order.user?.tradeUrl && (
        <div className="flex flex-wrap gap-2">
          <a
            href={order.user.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("admin.orders.openTrade")}
          </a>
          <button
            type="button"
            onClick={() => order.user?.tradeUrl && handleCopyTradeLink(order.user.tradeUrl)}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
              copied
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-white/10 bg-[#0d0a18] text-[#b8b2cd] hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t("admin.orders.copied")}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{t("admin.orders.copy")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const paymentExtrasBlock = showPayment && (arsQuote || isManualTransfer || buyerProof !== undefined) && (
    <div className={`space-y-3 ${mode === "all" ? "border-t border-white/[0.06] pt-4" : ""}`}>
      {arsQuote && (
        <div className="rounded-lg border border-accent/20 bg-accent/[0.07] p-4">
          <h5 className="mb-2.5 text-xs font-semibold text-fuchsia-200">
            {t("checkout.paymentQuote")}
          </h5>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div>
              <span className="block text-[11px] text-[#9e98b6]">{t("checkout.payInArs")}</span>
              <span className="font-semibold text-emerald-300 tabular-nums">
                {formatArs(arsQuote.settlement?.amount || 0)} ARS
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#9e98b6]">{t("checkout.baseAmount")}</span>
              <span className="font-semibold text-white tabular-nums">
                ${Number(arsQuote.base?.amount || order.totalPrice).toFixed(2)} USD
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#9e98b6]">{t("checkout.exchangeRate")}</span>
              <span className="font-semibold text-white tabular-nums">
                {t(`checkout.rateKind.${arsQuote.rate?.kind || "blue"}`)} ·{" "}
                {formatArs(arsQuote.rate?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {isManualTransfer && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
          <h5 className="mb-2.5 text-xs font-semibold text-emerald-200">
            {t("paymentMethod.manual_transfer.name")}
          </h5>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            {manualTransferSnapshot?.type === "crypto" ? (
              <>
                <div className="sm:col-span-2">
                  <span className="block text-[11px] text-[#9e98b6]">Wallet</span>
                  <span className="break-all font-mono font-semibold text-white">
                    {manualTransferSnapshot.crypto?.address || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#9e98b6]">
                    {t("purchases.network")}
                  </span>
                  <span className="font-semibold text-white">
                    {manualTransferSnapshot.crypto?.network || "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="block text-[11px] text-[#9e98b6]">Alias</span>
                  <span className="break-all font-semibold text-white">
                    {manualTransferSnapshot?.bank?.alias || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#9e98b6]">CBU / CVU</span>
                  <span className="break-all font-mono font-semibold text-white">
                    {manualTransferSnapshot?.bank?.cbu || "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[11px] text-[#9e98b6]">
                    {t("purchases.holder")}
                  </span>
                  <span className="font-semibold text-white">
                    {manualTransferSnapshot?.bank?.holder || "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
        <h5 className="mb-2 text-xs font-semibold text-[#c2bdd6]">
          {t("admin.orders.buyerProofTitle")}
        </h5>
        {buyerProof ? (
          <button
            type="button"
            onClick={onOpenProofModal}
            className="inline-flex items-center gap-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/12 px-3.5 py-2 text-left text-emerald-200 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold">{t("purchases.viewProof")}</span>
              <span className="block truncate text-[11px] text-emerald-100/75">
                {buyerProof.fileName || t("purchases.attachedFile")}
              </span>
            </span>
          </button>
        ) : (
          <p className="text-xs text-[#8e88a6]">{t("admin.orders.noBuyerProof")}</p>
        )}
      </div>
    </div>
  );

  return (
    <AdminSection className="space-y-5">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <CreditCard className="h-4 w-4 text-accent" />
        <h4 className="text-sm font-semibold text-white">{sectionTitle}</h4>
      </div>

      {mode === "payment" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          {paymentMethodCard}
          {paymentExtrasBlock}
        </div>
      ) : mode === "buyer" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {customerCard}
          {tradeLinkCard}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {customerCard}
            {paymentMethodCard}
            {tradeLinkCard}
          </div>
          {paymentExtrasBlock}
        </>
      )}
    </AdminSection>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
