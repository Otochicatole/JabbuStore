"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Upload,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Order, PaymentProofMetadata } from "@/features/admin/domain/types";
import { AdminBadge, AdminSection } from "@/features/admin/ui/AdminShell";

interface PayoutDetailsPanelProps {
  order: Order;
  adminProof: PaymentProofMetadata | null;
  adminProofUrl: string | null;
  canUploadAdminProof: boolean;
  uploadingProof: boolean;
  proofError: string | null;
  onUploadAdminProof: (file: File | null) => void;
  onOpenProofModal: () => void;
  mode?: "all" | "payment" | "seller";
}

export function getSellPayoutMethodLabel(
  paymentMethod: string | null | undefined,
  t: (key: string) => string,
) {
  switch (paymentMethod) {
    case "mercado_pago":
      return t("checkout.bankTransfer");
    case "paypal":
      return "PayPal";
    case "nowpayments":
      return "Crypto";
    case "ethereum":
      return "Ethereum (Web3)";
    case "binance":
      return "Binance Pay";
    default:
      return paymentMethod || t("common.notSpecified");
  }
}

export function PayoutDetailsPanel({
  order,
  adminProof,
  canUploadAdminProof,
  uploadingProof,
  proofError,
  onUploadAdminProof,
  onOpenProofModal,
  mode = "all",
}: PayoutDetailsPanelProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopyTradeLink = (tradeLink: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showSeller = mode === "all" || mode === "seller";
  const showPayment = mode === "all" || mode === "payment";
  const showTrade = mode === "all" || mode === "seller";

  const sectionTitle =
    mode === "seller"
      ? t("admin.sellOrders.tabs.seller")
      : t("admin.sellOrders.paymentDestinationData");

  const sellerCard = showSeller && (
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

  const payoutCard = showPayment && (
    <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 text-xs">
      <h5 className="text-xs font-semibold text-[#c2bdd6]">
        {t("admin.sellOrders.payoutDetail")}
      </h5>
      <div>
        <span className="block text-[11px] text-[#8e88a6]">
          {t("admin.sellOrders.transferRoute")}
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-white">
          {getSellPayoutMethodLabel(order.paymentMethod, t)}
        </span>
      </div>

      {order.paymentMethod === "nowpayments" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
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
        </div>
      )}

      {order.paymentMethod === "mercado_pago" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
          <div>
            <span className="mb-1 block text-[11px] text-[#8e88a6]">
              {t("checkout.payoutCurrency")}
            </span>
            <AdminBadge tone="accent">{order.metadata?.payoutCurrency || "ARS"}</AdminBadge>
          </div>
          <div>
            <span className="block text-[11px] text-[#8e88a6]">
              {order.metadata?.payoutCurrency === "USD"
                ? t("checkout.accountNumberOrIban")
                : t("admin.orders.destinationBankAccount")}
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
              <span className="block text-[11px] text-[#8e88a6]">
                {order.metadata?.payoutCurrency === "USD"
                  ? t("checkout.swiftBic")
                  : "CUIL / CUIT"}
              </span>
              <span className="font-mono text-white select-all">
                {order.metadata?.cuil || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {order.paymentMethod === "paypal" && (
        <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
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
        <p className="text-xs text-[#746e8d]">
          {t("admin.sellOrders.noExternalTransferDetails")}
        </p>
      )}
    </div>
  );

  const tradeLinkCard = showTrade && (
    <div className="flex flex-col justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 text-xs">
      <div>
        <h5 className="text-xs font-semibold text-[#c2bdd6]">
          {t("admin.sellOrders.tradeConsole")}
        </h5>
        <span className="mt-2 block text-[11px] text-[#8e88a6]">
          {t("admin.sellOrders.sellerTradeLink")}
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

  const proofSection = showPayment && (
    <div className={`rounded-lg border border-white/[0.06] bg-[#1a1630] p-4 ${mode === "all" ? "" : ""}`}>
      <h5 className="mb-2.5 text-xs font-semibold text-[#c2bdd6]">
        {t("admin.sellOrders.paymentProofTitle")}
      </h5>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        {adminProof ? (
          <button
            type="button"
            onClick={onOpenProofModal}
            className="inline-flex items-center gap-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/12 px-3.5 py-2 text-left text-emerald-200 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold">{t("purchases.viewProof")}</span>
              <span className="block truncate text-[11px] text-emerald-100/75">
                {adminProof.fileName || t("purchases.attachedFile")}
              </span>
            </span>
          </button>
        ) : (
          <p className="text-xs text-[#8e88a6]">{t("admin.sellOrders.noAdminProof")}</p>
        )}

        <label
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3.5 text-xs font-semibold transition-colors ${
            canUploadAdminProof && !uploadingProof
              ? "border-white/15 bg-[#0d0a18] text-white hover:border-white/25 hover:bg-[#141124] cursor-pointer"
              : "border-white/5 bg-white/[0.03] text-[#746e8d] cursor-not-allowed"
          }`}
          title={
            canUploadAdminProof
              ? t("admin.sellOrders.uploadProof")
              : t("admin.sellOrders.proofAvailableWhenPaid")
          }
        >
          {uploadingProof ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          <span>{adminProof ? t("common.replace") : t("admin.sellOrders.uploadProof")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="sr-only"
            disabled={!canUploadAdminProof || uploadingProof}
            onChange={(event) => {
              onUploadAdminProof(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {proofError && <p className="mt-2 text-xs font-medium text-rose-300">{proofError}</p>}
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
          {payoutCard}
          {proofSection}
        </div>
      ) : mode === "seller" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sellerCard}
          {tradeLinkCard}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {sellerCard}
            {payoutCard}
            {tradeLinkCard}
          </div>
          {proofSection}
        </>
      )}
    </AdminSection>
  );
}
