"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  FileText,
  ShieldCheck,
  CreditCard,
  Layers,
  Package,
  ShoppingCart,
  UserRound,
  WalletCards,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Order } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import { AdminOrderTicketsModal } from "@/shared/components/AdminOrderTicketsModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  AdminBadge,
  AdminButton,
  AdminSection,
  AdminStatusTabs,
} from "@/features/admin/ui/AdminShell";
import { OrderDetailItem } from "./OrderDetailItem";
import { OrderDetailPayoutDetails, getPaymentMethodLabel } from "./OrderDetailPayoutDetails";

type PurchaseDetailTab = "overview" | "items" | "payment" | "buyer";

interface OrderDetailRowProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string, botId?: string | null) => Promise<void>;
  resolvedItemsMap: Record<
    string,
    {
      float: number | null;
      pattern: number | null;
      rarity?: string;
      exterior?: string;
    }
  >;
}

export function OrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
}: OrderDetailRowProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<PurchaseDetailTab>("overview");
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTradeUrl, setCopiedTradeUrl] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  const getWorkflowStep = (): number => {
    switch (order.status) {
      case "PENDING_PAYMENT":
        return 1;
      case "PAID":
        return 2;
      case "TRADE_PENDING":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 0;
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 1500);
  };

  const handleCopyTradeUrl = (tradeUrl: string) => {
    navigator.clipboard.writeText(tradeUrl);
    setCopiedTradeUrl(true);
    setTimeout(() => setCopiedTradeUrl(false), 1500);
  };

  const handleCopyAssetId = (assetId: string) => {
    navigator.clipboard.writeText(assetId);
    setCopiedAssetId(assetId);
    setTimeout(() => setCopiedAssetId(null), 1500);
  };

  const handleCopyAllAssetIds = () => {
    const assetIds = order.items.map((item) => item.assetId).join(", ");
    navigator.clipboard.writeText(assetIds);
    setCopiedAllAssets(true);
    setTimeout(() => setCopiedAllAssets(false), 2000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    await onUpdateStatus(orderId, newStatus);
  };

  const currentStep = getWorkflowStep();
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "CANCELLED";
  const buyerProof = order.metadata?.buyerPaymentProof;
  const buyerProofUrl = buyerProof ? `${BACKEND_URL}/orders/${order.id}/payment-proof/buyer` : null;
  const arsSettlement =
    order.metadata?.paymentQuote?.settlement?.currency === "ARS" &&
    typeof order.metadata.paymentQuote.settlement.amount === "number"
      ? order.metadata.paymentQuote.settlement.amount
      : null;
  const createdLabel = order.createdAt ? new Date(order.createdAt).toLocaleString() : null;
  const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod, t);

  const statusBadge =
    order.status === "PENDING_PAYMENT"
      ? { label: t("purchases.status.paymentPending"), tone: "warning" as const }
      : order.status === "PAID"
        ? { label: t("purchases.status.paid"), tone: "info" as const }
        : order.status === "TRADE_PENDING"
          ? { label: t("purchases.status.tradePending"), tone: "accent" as const }
          : order.status === "COMPLETED"
            ? { label: t("purchases.status.completed"), tone: "success" as const }
            : { label: t("purchases.status.cancelled"), tone: "danger" as const };

  const steps = [
    {
      num: 1,
      title: t("admin.orders.reviewPayment"),
      sub: currentStep === 1 ? t("admin.orders.paymentPending") : t("admin.orders.paymentVerified"),
    },
    {
      num: 2,
      title: t("admin.orders.sourcingItems"),
      sub:
        currentStep === 2
          ? t("admin.orders.searchYouPin")
          : currentStep > 2
            ? t("admin.orders.skinsReady")
            : t("admin.orders.queued"),
    },
    {
      num: 3,
      title: t("admin.orders.sendTrade"),
      sub:
        currentStep === 3
          ? t("admin.orders.activeTrade")
          : currentStep > 3
            ? t("admin.orders.tradeAccepted")
            : t("admin.orders.queued"),
    },
    {
      num: 4,
      title: t("admin.orders.stepCompleted"),
      sub: currentStep === 4 ? t("purchases.step.skinDelivered") : t("admin.orders.queued"),
    },
  ];

  const tabs: { value: PurchaseDetailTab; label: string; count?: number }[] = [
    { value: "overview", label: t("admin.orders.tabs.overview") },
    { value: "items", label: t("admin.orders.tabs.items"), count: order.items.length },
    {
      value: "payment",
      label: t("admin.orders.tabs.payment"),
      count: buyerProof ? 1 : undefined,
    },
    { value: "buyer", label: t("admin.orders.tabs.buyer") },
  ];

  return (
    <div className="space-y-4">
      {/* Persistent Operational Header */}
      <AdminSection className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge tone="info">
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("admin.orders.operationKindPurchase")}
              </AdminBadge>
              <AdminBadge tone={statusBadge.tone} dot>
                {statusBadge.label}
              </AdminBadge>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0d0a18] px-2.5 py-0.5 font-mono text-xs text-[#c2bdd6] hover:border-white/20 hover:text-white transition-colors cursor-pointer tabular-nums"
              >
                <span>#{order.id}</span>
                {copiedOrderId ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-[#8e88a6]" />
                )}
              </button>
              {createdLabel && (
                <span className="font-mono text-xs text-[#8e88a6] tabular-nums">
                  {createdLabel}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              {t("admin.orders.purchaseOperationTitle")}
            </h3>
            <p className="max-w-2xl text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
              {t("admin.orders.purchaseOperationDescription")}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {buyerProof && (
              <AdminButton
                type="button"
                variant="success"
                size="sm"
                icon={FileText}
                onClick={() => setProofOpen(true)}
              >
                {t("purchases.viewProof")}
              </AdminButton>
            )}
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              icon={MessageSquare}
              onClick={() => setIsTicketsModalOpen(true)}
            >
              {t("admin.tickets.panelButton")}
            </AdminButton>
          </div>
        </div>

        {/* Unified Key Summary Strip (no nested cards) */}
        <div className="grid grid-cols-1 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#1a1630] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 p-3.5">
            {order.user?.avatar ? (
              <img
                src={order.user.avatar}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] text-[#9e98b6]">
                <UserRound className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-[#8e88a6]">
                {t("admin.orders.buyer")}
              </span>
              <p className="truncate text-sm font-semibold text-white">
                {order.user?.name || t("admin.common.unknownUser")}
              </p>
              <p className="truncate font-mono text-xs text-[#a39db9] tabular-nums">
                {order.user?.steamId || "—"}
              </p>
            </div>
          </div>

          <div className="p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <WalletCards className="h-3.5 w-3.5" />
              {t("admin.orders.totalAmount")}
            </span>
            <p className="mt-1 text-base font-semibold text-emerald-400 tabular-nums">
              ${order.totalPrice.toLocaleString()} USD
            </p>
            <p className="mt-0.5 truncate text-xs text-[#b8b2cd] tabular-nums">
              {arsSettlement !== null
                ? `${formatArs(arsSettlement)} ARS · ${paymentMethodLabel}`
                : paymentMethodLabel}
            </p>
          </div>

          <div className="p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Package className="h-3.5 w-3.5" />
              {t("admin.orders.tabs.items")}
            </span>
            <p className="mt-1 text-sm font-semibold text-white tabular-nums">
              {t("admin.orders.itemsInOrder", { count: order.items.length })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {buyerProof ? (
                <button
                  type="button"
                  onClick={() => setProofOpen(true)}
                  className="font-medium text-emerald-300 hover:underline cursor-pointer"
                >
                  {t("admin.orders.proofAttached")} · {t("common.view")}
                </button>
              ) : (
                <span className="text-[#8e88a6]">
                  {order.user?.tradeUrl
                    ? t("admin.orders.customerTradeLink")
                    : t("admin.common.noTradeUrl")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Always-Visible Status Controls */}
        <div className="border-t border-white/[0.06] pt-4 space-y-2.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-xs font-semibold text-white">
              {t("admin.orders.manualStatusChange")}
            </h4>
            <p className="text-xs text-[#9e98b6]">
              {t("admin.orders.purchaseStatusHelper")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => !isCancelled && handleUpdateStatus(order.id, "PAID")}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.markPaid")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                order.status === "PAID"
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                  : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              {t("admin.orders.step1PaymentReceived")}
            </button>

            <button
              type="button"
              onClick={() => !isCancelled && handleUpdateStatus(order.id, "TRADE_PENDING")}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.markTradePending")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                order.status === "TRADE_PENDING"
                  ? "border-accent/50 bg-accent/15 text-fuchsia-200"
                  : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("admin.orders.step2TradePending")}
            </button>

            <button
              type="button"
              onClick={() => !isCancelled && handleUpdateStatus(order.id, "COMPLETED")}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.completeOrder")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                order.status === "COMPLETED"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              {t("admin.orders.step3Complete")}
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus(order.id, "PENDING_PAYMENT")}
              title={t("admin.orders.resetToPending")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                order.status === "PENDING_PAYMENT"
                  ? "border-amber-500/35 bg-amber-500/12 text-amber-200"
                  : "border-white/10 bg-[#0d0a18] text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("admin.orders.resetToPending")}
            </button>

            <button
              type="button"
              onClick={() => canCancel && handleUpdateStatus(order.id, "CANCELLED")}
              disabled={!canCancel}
              title={canCancel ? t("admin.orders.cancelOrder") : t("admin.orders.cancelFromPending")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                order.status === "CANCELLED"
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              {t("admin.orders.rejectCancel")}
            </button>
          </div>
        </div>
      </AdminSection>

      {/* Section Tabs */}
      <AdminStatusTabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Panel Content */}
      {activeTab === "overview" && (
        <div role="tabpanel" className="space-y-4">
          <AdminSection className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-accent" />
                {t("purchases.transactionProgress", { type: t("purchases.buy") })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => {
                const done = currentStep > step.num;
                const active = currentStep === step.num;
                return (
                  <div
                    key={step.num}
                    className={`flex items-center gap-2.5 rounded-md border p-3 transition-colors ${
                      active
                        ? "border-accent/40 bg-accent/10 text-white"
                        : done
                          ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200"
                          : "border-white/[0.06] bg-[#1a1630] text-[#8e88a6]"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold tabular-nums ${
                        active
                          ? "bg-accent text-white"
                          : done
                            ? "bg-emerald-500 text-black"
                            : "bg-white/[0.06] text-[#9e98b6]"
                      }`}
                    >
                      {done ? "✓" : step.num}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-semibold leading-tight">
                        {step.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] opacity-80">
                        {step.sub}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminSection>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Quick Trade URL card */}
            <AdminSection className="flex flex-col justify-between gap-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {t("admin.orders.customerTradeLink")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("buyer")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                  >
                    <span>{t("admin.orders.tabs.buyer")}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-2 break-all rounded-md border border-white/[0.06] bg-[#0d0a18] p-2.5 font-mono text-xs leading-relaxed text-[#d4cfe6] select-all">
                  {order.user?.tradeUrl || t("admin.common.noTradeUrl")}
                </p>
              </div>

              {order.user?.tradeUrl && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={order.user.tradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("admin.orders.openTrade")}
                  </a>
                  <button
                    type="button"
                    onClick={() => order.user?.tradeUrl && handleCopyTradeUrl(order.user.tradeUrl)}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                      copiedTradeUrl
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                    }`}
                  >
                    {copiedTradeUrl ? (
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
            </AdminSection>

            {/* Quick Items Preview card */}
            <AdminSection className="flex flex-col justify-between gap-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {t("admin.orders.quickActions")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("items")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                  >
                    <span>{t("admin.orders.viewAllItems", { count: order.items.length })}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="mt-2.5 divide-y divide-white/[0.06] rounded-md border border-white/[0.06] bg-[#1a1630]">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <span className="truncate font-medium text-white">{item.name}</span>
                      <span className="shrink-0 font-mono font-semibold text-emerald-400 tabular-nums">
                        ${item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="px-3 py-1.5 text-[11px] text-[#9e98b6]">
                      +{order.items.length - 3} {t("common.items").toLowerCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Package}
                  onClick={() => setActiveTab("items")}
                >
                  {t("admin.orders.viewAllItems", { count: order.items.length })}
                </AdminButton>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={CreditCard}
                  onClick={() => setActiveTab("payment")}
                >
                  {t("admin.orders.tabs.payment")}
                </AdminButton>
              </div>
            </AdminSection>
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div role="tabpanel">
          <AdminSection className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {t("admin.orders.itemsInOrder", { count: order.items.length })}
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCopyAllAssetIds}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                  copiedAllAssets
                    ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
                    : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                }`}
                title={t("admin.orders.copySteamIds")}
              >
                {copiedAllAssets ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t("admin.orders.idsCopied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("admin.orders.copySteamIds")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {order.items.map((item) => (
                <OrderDetailItem
                  key={item.id}
                  item={item}
                  resolvedDetails={resolvedItemsMap[item.assetId] || {}}
                  copiedAssetId={copiedAssetId}
                  onCopyAssetId={handleCopyAssetId}
                />
              ))}
            </div>
          </AdminSection>
        </div>
      )}

      {activeTab === "payment" && (
        <div role="tabpanel">
          <OrderDetailPayoutDetails
            order={order}
            mode="payment"
            onOpenProofModal={() => setProofOpen(true)}
          />
        </div>
      )}

      {activeTab === "buyer" && (
        <div role="tabpanel" className="space-y-4">
          <OrderDetailPayoutDetails
            order={order}
            mode="buyer"
            onOpenProofModal={() => setProofOpen(true)}
          />

          <AdminSection className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-accent" />
                {t("admin.tickets.panelTitle")}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-[#9e98b6]">
                {t("admin.tickets.panelDescBuy")}
              </p>
            </div>
            <AdminButton
              type="button"
              variant="secondary"
              icon={MessageSquare}
              onClick={() => setIsTicketsModalOpen(true)}
              className="shrink-0"
            >
              {t("admin.tickets.panelButton")}
            </AdminButton>
          </AdminSection>
        </div>
      )}

      <PaymentProofModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        proofUrl={buyerProofUrl}
        proof={buyerProof}
        title={t("admin.orders.buyerProof")}
      />

      <AdminOrderTicketsModal
        isOpen={isTicketsModalOpen}
        onClose={() => setIsTicketsModalOpen(false)}
        orderId={order.id}
        orderType={order.type}
        orderPrice={order.totalPrice}
      />
    </div>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
