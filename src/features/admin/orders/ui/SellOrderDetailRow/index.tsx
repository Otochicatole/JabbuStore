"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Bot,
  Copy,
  Check,
  ExternalLink,
  FileText,
  ShieldCheck,
  CreditCard,
  Layers,
  HandCoins,
  Package,
  UserRound,
  WalletCards,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { AdminBotOption, Order, PaymentProofMetadata } from "@/features/admin/domain/types";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import { AdminOrderTicketsModal } from "@/shared/components/AdminOrderTicketsModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { PayoutDetailsPanel, getSellPayoutMethodLabel } from "./PayoutDetailsPanel";
import { SellOrderDetailItem } from "./SellOrderDetailItem";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";
import { useCurrency } from "@/features/currency/context/CurrencyContext";
import { RetentionCountdown } from "@/shared/components/RetentionCountdown";
import {
  AdminBadge,
  AdminButton,
  AdminSection,
  AdminStatusTabs,
} from "@/features/admin/ui/AdminShell";

type SellDetailTab = "overview" | "items" | "payment" | "seller";

interface SellOrderDetailRowProps {
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
  bots?: AdminBotOption[];
}

export function SellOrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
  bots = [],
}: SellOrderDetailRowProps) {
  const { t } = useI18n();
  const { rates } = useCurrency();
  const arsRate = rates?.rates.ARS ?? 0;

  const formatRate = (value: number, currency: "USD" | "ARS") => {
    const locale = currency === "USD" ? "en-US" : "es-AR";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const selectedCurrency =
    order.metadata?.payoutCurrency ||
    (order.paymentMethod === "nowpayments" ? "USDT" : "USD");

  const [activeTab, setActiveTab] = useState<SellDetailTab>("overview");
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTradeUrl, setCopiedTradeUrl] = useState(false);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [localAdminProof, setLocalAdminProof] = useState<PaymentProofMetadata | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string>(order.botId || "");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isRequoting, setIsRequoting] = useState(false);
  const [newRequotePrice, setNewRequotePrice] = useState<string>("");
  const [requotingError, setRequotingError] = useState<string | null>(null);
  const [requotingLoading, setRequotingLoading] = useState(false);

  const getWorkflowStep = (): number => {
    switch (order.status) {
      case "PENDING_PAYMENT":
        return 1;
      case "TRADE_PENDING":
        return 2;
      case "RETENTION":
      case "AWAITING_APPROVAL":
        return 3;
      case "PAID":
        return 4;
      case "COMPLETED":
        return 5;
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

  const handleCopyAllAssetIds = () => {
    const assetIds = order.items.map((item) => item.assetId).join(", ");
    navigator.clipboard.writeText(assetIds);
    setCopiedAllAssets(true);
    setTimeout(() => setCopiedAllAssets(false), 2000);
  };

  const currentStep = getWorkflowStep();
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "CANCELLED";
  const adminProof = localAdminProof || order.metadata?.adminPaymentProof || null;
  const adminProofUrl = adminProof ? `${BACKEND_URL}/orders/${order.id}/payment-proof/admin` : null;
  const canUploadAdminProof = order.status === "PAID" || order.status === "COMPLETED";
  const assignedBotLabel = order.bot
    ? `${order.bot.name} (${order.bot.steamId.slice(-4)})`
    : t("admin.common.notAssigned");
  const createdLabel = order.createdAt ? new Date(order.createdAt).toLocaleString() : null;
  const payoutMethodLabel = getSellPayoutMethodLabel(order.paymentMethod, t);

  const statusBadge =
    order.status === "PENDING_PAYMENT"
      ? { label: t("purchases.status.sellPendingApproval"), tone: "warning" as const }
      : order.status === "TRADE_PENDING"
        ? { label: t("purchases.status.sellApprovedSendTrade"), tone: "info" as const }
        : order.status === "RETENTION"
          ? { label: t("purchases.status.sellRetention"), tone: "warning" as const }
          : order.status === "AWAITING_APPROVAL"
            ? { label: t("purchases.status.sellAwaitingApproval"), tone: "warning" as const }
            : order.status === "PAID"
              ? { label: t("purchases.status.tradeConfirmedPendingPayment"), tone: "accent" as const }
              : order.status === "COMPLETED"
                ? { label: t("purchases.status.sellCompletedPaid"), tone: "success" as const }
                : { label: t("purchases.status.sellRejected"), tone: "danger" as const };

  const handleAdminProofUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingProof(true);
    setProofError(null);

    try {
      const formData = new FormData();
      formData.append("proof", file);

      const response = await fetchWithAuth(
        `${BACKEND_URL}/orders/${order.id}/payment-proof/admin`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No pudimos subir el comprobante.");
      }

      setLocalAdminProof(data?.proof || null);
    } catch (err: unknown) {
      setProofError(err instanceof Error ? err.message : "No pudimos subir el comprobante.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus !== "CANCELLED" && newStatus !== "PENDING_PAYMENT" && !selectedBotId) {
      setAlertMessage(t("admin.orders.selectBotRequiredError"));
      setAlertOpen(true);
      return;
    }
    await onUpdateStatus(orderId, newStatus, selectedBotId || null);
  };

  const handleRequoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newRequotePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setRequotingError(t("admin.priceModal.invalidPrice"));
      return;
    }

    setRequotingLoading(true);
    setRequotingError(null);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/orders/${order.id}/requote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPrice: priceNum }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Error al actualizar la cotización");
      }

      setIsRequoting(false);
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      setRequotingError(err instanceof Error ? err.message : "Error al enviar la re-tasa.");
    } finally {
      setRequotingLoading(false);
    }
  };

  const steps = [
    {
      num: 1,
      title: t("admin.sellOrders.approveSale"),
      sub: currentStep === 1 ? t("purchases.step.pending") : t("admin.sellOrders.approved"),
    },
    {
      num: 2,
      title: t("admin.sellOrders.receiveTrade"),
      sub:
        currentStep === 2
          ? t("admin.sellOrders.waitingItem")
          : currentStep > 2
            ? t("admin.sellOrders.itemInBot")
            : t("admin.orders.queued"),
    },
    {
      num: 3,
      title: t("purchases.step.retention"),
      sub:
        order.status === "AWAITING_APPROVAL"
          ? t("purchases.step.awaitingApproval")
          : currentStep === 3
            ? t("purchases.step.retentionAwaiting")
            : currentStep > 3
              ? t("purchases.step.retentionPassed")
              : t("admin.orders.queued"),
    },
    {
      num: 4,
      title: t("admin.sellOrders.payUser"),
      sub:
        currentStep === 4
          ? t("admin.sellOrders.toTransfer")
          : currentStep > 4
            ? t("admin.sellOrders.paymentSent")
            : t("admin.orders.queued"),
    },
    {
      num: 5,
      title: t("admin.sellOrders.completed"),
      sub: currentStep === 5 ? t("admin.sellOrders.ready") : t("purchases.step.pending"),
    },
  ];

  const tabs: { value: SellDetailTab; label: string; count?: number }[] = [
    { value: "overview", label: t("admin.orders.tabs.overview") },
    { value: "items", label: t("admin.orders.tabs.items"), count: order.items.length },
    {
      value: "payment",
      label: t("admin.orders.tabs.payment"),
      count: adminProof ? 1 : undefined,
    },
    { value: "seller", label: t("admin.sellOrders.tabs.seller") },
  ];

  return (
    <div className="space-y-4">
      {/* Persistent Operational Header */}
      <AdminSection className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge tone="accent">
                <HandCoins className="h-3.5 w-3.5" />
                {t("admin.sellOrders.operationKindSell")}
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
              {t("admin.sellOrders.sellOperationTitle")}
            </h3>
            <p className="max-w-2xl text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">
              {t("admin.sellOrders.sellOperationDescription")}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {adminProof && (
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
                {t("admin.sellOrders.seller")}
              </span>
              <p className="truncate text-sm font-semibold text-white">
                {order.user?.name || t("admin.common.unknownUser")}
              </p>
              <p className="truncate font-mono text-xs text-[#a39db9] tabular-nums">
                {order.user?.steamId || "—"}
              </p>
            </div>
          </div>

          <div className="p-3.5 space-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <WalletCards className="h-3.5 w-3.5" />
              {t("admin.sellOrders.amountToPay")} · {payoutMethodLabel}
            </span>
            <div className="space-y-1 font-mono text-xs tabular-nums">
              <div
                className={`flex items-center justify-between rounded px-2 py-0.5 ${
                  selectedCurrency === "USD" || selectedCurrency === "USDT"
                    ? "border border-emerald-500/25 bg-emerald-500/12 font-semibold text-emerald-300"
                    : "text-[#8e88a6]"
                }`}
              >
                <span>USD:</span>
                <span>
                  ${order.totalPrice.toFixed(2)} USD{" "}
                  {(selectedCurrency === "USD" || selectedCurrency === "USDT") && "✓"}
                </span>
              </div>
              {arsRate > 0 && (
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${
                    selectedCurrency === "ARS"
                      ? "border border-emerald-500/25 bg-emerald-500/12 font-semibold text-emerald-300"
                      : "text-[#8e88a6]"
                  }`}
                >
                  <span>ARS:</span>
                  <span>
                    {formatRate(order.totalPrice * arsRate, "ARS")} ARS{" "}
                    {selectedCurrency === "ARS" && "✓"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 space-y-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
              <Bot className="h-3.5 w-3.5" />
              {t("admin.orders.selectedBot")}
            </span>
            <p className="truncate text-sm font-semibold text-white">
              {assignedBotLabel}
            </p>
            <p className="text-xs text-[#b8b2cd] tabular-nums">
              {t("admin.sellOrders.itemsToReceive", { count: order.items.length })}
            </p>
          </div>
        </div>

        {/* Always-Visible Bot Assignment & Status Controls */}
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_1fr] lg:items-start">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Bot className="h-3.5 w-3.5 text-accent" />
                {t("admin.orders.selectBotAccount")}
              </label>
              {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
                <AdminSelect
                  value={selectedBotId}
                  onChange={setSelectedBotId}
                  className="w-full"
                  options={[
                    { value: "", label: t("admin.orders.selectBotPlaceholder") },
                    ...bots
                      .filter((b) => b.isActive)
                      .map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.steamId.slice(-4)})`,
                      })),
                  ]}
                />
              ) : (
                <span className="block rounded-md border border-white/10 bg-[#0d0a18] px-3 py-2 text-xs font-medium text-white">
                  {assignedBotLabel}
                </span>
              )}
              <p className="text-[11px] leading-relaxed text-[#9e98b6]">
                {t("admin.sellOrders.sellBotHelper")}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-xs font-semibold text-white">
                  {t("admin.sellOrders.correctFlowAction")}
                </h4>
                <p className="text-xs text-[#9e98b6]">
                  {t("admin.sellOrders.sellStatusHelper")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => !isCancelled && handleUpdateStatus(order.id, "TRADE_PENDING")}
                  disabled={isCancelled}
                  title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.approveSaleTitle")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status === "TRADE_PENDING"
                      ? "border-orange-500/40 bg-orange-500/15 text-orange-200"
                      : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("admin.sellOrders.approveSale")}
                </button>

                <button
                  type="button"
                  onClick={() => !isCancelled && handleUpdateStatus(order.id, "RETENTION")}
                  disabled={isCancelled}
                  title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.confirmTradeReceived")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status === "RETENTION" || order.status === "AWAITING_APPROVAL"
                      ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                      : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("admin.sellOrders.tradeReceivedStep")}
                </button>

                <button
                  type="button"
                  onClick={() => !isCancelled && handleUpdateStatus(order.id, "PAID")}
                  disabled={isCancelled || (order.status !== "RETENTION" && order.status !== "PAID")}
                  title={t("admin.orders.releaseHoldTitle")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status === "PAID"
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                      : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("admin.orders.releaseHold")}
                </button>

                <button
                  type="button"
                  onClick={() => !isCancelled && handleUpdateStatus(order.id, "COMPLETED")}
                  disabled={isCancelled}
                  title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.completeSale")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status === "COMPLETED"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {t("admin.sellOrders.paymentSentStep")}
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order.id, "PENDING_PAYMENT")}
                  title={t("admin.sellOrders.resetToPending")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                    order.status === "PENDING_PAYMENT"
                      ? "border-amber-500/35 bg-amber-500/12 text-amber-200"
                      : "border-white/10 bg-[#0d0a18] text-[#9e98b6] hover:text-white"
                  }`}
                >
                  {t("admin.sellOrders.resetToPending")}
                </button>

                <button
                  type="button"
                  onClick={() => canCancel && handleUpdateStatus(order.id, "CANCELLED")}
                  disabled={!canCancel}
                  title={canCancel ? t("admin.sellOrders.cancelSale") : t("admin.sellOrders.cancelFromPending")}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status === "CANCELLED"
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {t("admin.sellOrders.rejectCancel")}
                </button>
              </div>
            </div>
          </div>

          {(order.status === "RETENTION" || order.status === "AWAITING_APPROVAL") && (
            <div className="rounded-lg border border-white/[0.07] bg-[#0e0b1a] p-4">
              {order.status === "RETENTION" ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300">
                        {t("admin.orders.retentionActiveTitle")}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#9e98b6]">
                        {t("admin.orders.retentionActiveDesc")}
                      </p>
                    </div>
                    {!isRequoting && (
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setNewRequotePrice(order.totalPrice.toString());
                          setIsRequoting(true);
                        }}
                      >
                        {t("admin.sellOrders.reQuoteButton")}
                      </AdminButton>
                    )}
                  </div>

                  {order.metadata?.retentionStartedAt && (
                    <RetentionCountdown retentionStartedAt={order.metadata.retentionStartedAt} />
                  )}

                  {isRequoting && (
                    <form
                      onSubmit={handleRequoteSubmit}
                      className="space-y-2.5 rounded-md border border-white/10 bg-[#1a1630] p-3"
                    >
                      <label className="block text-xs font-medium text-[#b8b2cd]">
                        {t("admin.sellOrders.reQuoteInputLabel")}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={newRequotePrice}
                          onChange={(e) => setNewRequotePrice(e.target.value)}
                          placeholder="295.00"
                          className="h-9 w-36 rounded-md border border-white/10 bg-[#0d0a18] px-3 font-mono text-sm font-semibold text-white outline-none focus:border-accent"
                        />
                        <AdminButton
                          type="submit"
                          size="sm"
                          variant="success"
                          loading={requotingLoading}
                          disabled={requotingLoading}
                        >
                          {requotingLoading
                            ? t("admin.sellOrders.reQuoteUpdating")
                            : t("admin.sellOrders.reQuoteConfirm")}
                        </AdminButton>
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsRequoting(false)}
                        >
                          {t("common.cancel")}
                        </AdminButton>
                      </div>
                      {requotingError && (
                        <p className="text-xs font-medium text-rose-300">{requotingError}</p>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-sky-300">
                    {t("admin.sellOrders.reQuoteSent")}
                  </h4>
                  <p className="text-xs text-[#b8b2cd]">
                    {t("admin.sellOrders.reQuoteSentDesc", {
                      newPrice: order.totalPrice.toFixed(2),
                      originalPrice: (order.metadata?.originalPrice || order.totalPrice).toFixed(2),
                    })}
                  </p>
                  <p className="text-xs font-medium text-amber-300">
                    {t("admin.sellOrders.reQuoteAwaitingApproval")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminSection>

      {/* Section Tabs */}
      <AdminStatusTabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div role="tabpanel" className="space-y-4">
          <AdminSection className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-accent" />
                {t("admin.sellOrders.operationFlow")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
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
            <AdminSection className="flex flex-col justify-between gap-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {t("admin.sellOrders.sellerTradeLink")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("seller")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                  >
                    <span>{t("admin.sellOrders.tabs.seller")}</span>
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
              <h4 className="text-sm font-semibold text-white">
                {t("admin.sellOrders.itemsToReceive", { count: order.items.length })}
              </h4>

              <button
                type="button"
                onClick={handleCopyAllAssetIds}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                  copiedAllAssets
                    ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
                    : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                }`}
                title={t("admin.sellOrders.copySellerSkinIds")}
              >
                {copiedAllAssets ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t("admin.orders.idsCopied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("admin.sellOrders.copySellerSkinIds")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {order.items.map((item) => (
                <SellOrderDetailItem
                  key={item.id}
                  item={item}
                  resolvedDetails={resolvedItemsMap[item.assetId] || {}}
                  sellerSteamId={order.user?.steamId || undefined}
                />
              ))}
            </div>
          </AdminSection>
        </div>
      )}

      {activeTab === "payment" && (
        <div role="tabpanel">
          <PayoutDetailsPanel
            order={order}
            mode="payment"
            adminProof={adminProof}
            adminProofUrl={adminProofUrl}
            canUploadAdminProof={canUploadAdminProof}
            uploadingProof={uploadingProof}
            proofError={proofError}
            onUploadAdminProof={handleAdminProofUpload}
            onOpenProofModal={() => setProofOpen(true)}
          />
        </div>
      )}

      {activeTab === "seller" && (
        <div role="tabpanel" className="space-y-4">
          <PayoutDetailsPanel
            order={order}
            mode="seller"
            adminProof={adminProof}
            adminProofUrl={adminProofUrl}
            canUploadAdminProof={canUploadAdminProof}
            uploadingProof={uploadingProof}
            proofError={proofError}
            onUploadAdminProof={handleAdminProofUpload}
            onOpenProofModal={() => setProofOpen(true)}
          />

          <AdminSection className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-accent" />
                {t("admin.tickets.panelTitle")}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-[#9e98b6]">
                {t("admin.tickets.panelDescSell")}
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
        proofUrl={adminProofUrl}
        proof={adminProof}
        title={t("admin.sellOrders.userPaymentProof")}
      />

      <AlertConfirmModal
        isOpen={alertOpen}
        title={t("admin.orders.alertTitle")}
        message={alertMessage}
        type="warning"
        onConfirm={() => setAlertOpen(false)}
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
