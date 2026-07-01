"use client";

import React, { useState } from "react";
import {
  Bot,
  Copy,
  Check,
  Layers,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";
import { AdminBotOption, Order } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { OrderDetailItem } from "./OrderDetailItem";
import { OrderDetailPayoutDetails } from "./OrderDetailPayoutDetails";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

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
  bots?: AdminBotOption[];
}

export function OrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
  bots = [],
}: OrderDetailRowProps) {
  const { t } = useI18n();
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string>(order.botId || "");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Workflow steps based on order status
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

  const handleCopyAssetId = (assetId: string) => {
    navigator.clipboard.writeText(assetId);
    setCopiedAssetId(assetId);
    setTimeout(() => {
      setCopiedAssetId(null);
    }, 1500);
  };

  // AUTOMATION: Copies ALL Asset IDs in a comma-separated format for quick search in Steam Trade Window
  const handleCopyAllAssetIds = () => {
    const assetIds = order.items.map((item) => item.assetId).join(", ");
    navigator.clipboard.writeText(assetIds);
    setCopiedAllAssets(true);
    setTimeout(() => {
      setCopiedAllAssets(false);
    }, 2000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus !== "CANCELLED" && newStatus !== "PENDING_PAYMENT" && !selectedBotId) {
      setAlertMessage(t("admin.orders.selectBotRequiredError") || "Debes seleccionar una cuenta de bot para poder cambiar el estado.");
      setAlertOpen(true);
      return;
    }
    await onUpdateStatus(orderId, newStatus, selectedBotId || null);
  };

  const currentStep = getWorkflowStep();
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "CANCELLED";
  const buyerProof = order.metadata?.buyerPaymentProof;
  const buyerProofUrl = buyerProof ? `${BACKEND_URL}/orders/${order.id}/payment-proof/buyer` : null;
  const assignedBotLabel = order.bot ? `${order.bot.name} (${order.bot.steamId.slice(-4)})` : t("admin.common.notAssigned") || "Not assigned";
  const statusLabel =
    order.status === "PENDING_PAYMENT"
      ? t("purchases.status.paymentPending")
      : order.status === "PAID"
        ? t("purchases.status.paid")
        : order.status === "TRADE_PENDING"
          ? t("purchases.status.tradePending")
          : order.status === "COMPLETED"
            ? t("purchases.status.completed")
            : t("purchases.status.cancelled");

  return (
    <div
      className={`bg-[#0e0d16]/90 border border-t-2 border-t-blue-400/70 p-4 sm:p-6 transition-all duration-300 relative overflow-hidden rounded-[3px] ${
        order.status === "PENDING_PAYMENT"
          ? "border-white/5 hover:border-orange-500/20"
          : order.status === "PAID"
            ? "border-blue-500/10 hover:border-blue-500/30"
            : order.status === "TRADE_PENDING"
              ? "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.05)]"
              : "border-emerald-500/10 hover:border-emerald-500/30"
      }`}
    >
      <div className="mb-5 overflow-hidden rounded-[3px] border border-blue-400/15 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(17,15,30,0.62)_48%,rgba(217,70,239,0.08))]">
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[3px] border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300">
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("admin.orders.operationKindPurchase")}
              </span>
              <span className="rounded-[3px] border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-white/45">
                {t("purchases.order")} ID: {order.id}
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">
              {t("admin.orders.purchaseOperationTitle")}
            </h3>
            <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-[#a8a8bc]">
              {t("admin.orders.purchaseOperationDescription")}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px]">
            <div className="rounded-[3px] border border-white/5 bg-black/15 p-3">
              <span className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#84849b]">
                <UserRound className="h-3 w-3" />
                {t("admin.orders.buyer")}
              </span>
              <p className="truncate text-sm font-black text-white">{order.user?.name || t("admin.common.unknownUser")}</p>
              <p className="truncate font-mono text-[10px] font-bold text-accent">{order.user?.steamId || "-"}</p>
            </div>
            <div className="rounded-[3px] border border-white/5 bg-black/15 p-3">
              <span className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#84849b]">
                <WalletCards className="h-3 w-3" />
                {t("admin.orders.totalAmount")}
              </span>
              <p className="text-lg font-black leading-none text-emerald-400">${order.totalPrice.toLocaleString()} USD</p>
              <p className="mt-1 text-[10px] font-bold text-white/35">{statusLabel}</p>
            </div>
            <div className="rounded-[3px] border border-white/5 bg-black/15 p-3">
              <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#84849b]">
                {t("common.status")}
              </span>
              <span
                className={`inline-flex rounded-[3px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                  order.status === "PENDING_PAYMENT"
                    ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
                    : order.status === "PAID"
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                      : order.status === "TRADE_PENDING"
                        ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                        : order.status === "COMPLETED"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="rounded-[3px] border border-white/5 bg-black/15 p-3">
              <span className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#84849b]">
                <Bot className="h-3 w-3" />
                {t("admin.orders.selectedBot")}
              </span>
              <p className="truncate text-xs font-black text-white">{assignedBotLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="mb-6 bg-white/[0.01] border border-white/5 p-4 rounded-[3px]">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider font-mono text-[#84849b] mb-4">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-accent" />
            {t("purchases.transactionProgress", { type: t("purchases.buy") })}
          </span>
          <span className="text-white/40 font-mono">{t("purchases.order")} ID: {order.id}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Paso 1: Pago */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 1
                ? "bg-orange-500/5 border-orange-500/20 text-orange-400"
                : currentStep > 1
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60"
                  : "bg-white/[0.01] border-white/5 text-white/30"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                currentStep === 1
                  ? "bg-orange-400 text-black"
                  : currentStep > 1
                    ? "bg-emerald-400 text-black"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                {t("admin.orders.reviewPayment")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 1 ? t("admin.orders.paymentPending") : t("admin.orders.paymentVerified")}
              </span>
            </div>
          </div>

          {/* Paso 2: Preparación */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 2
                ? "bg-blue-500/5 border-blue-500/20 text-blue-400"
                : currentStep > 2
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60"
                  : "bg-white/[0.01] border-white/5 text-white/30"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                currentStep === 2
                  ? "bg-blue-400 text-black"
                  : currentStep > 2
                    ? "bg-emerald-400 text-black"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                {t("admin.orders.sourcingItems")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 2
                  ? t("admin.orders.searchYouPin")
                  : currentStep > 2
                    ? t("admin.orders.skinsReady")
                    : t("admin.orders.queued")}
              </span>
            </div>
          </div>

          {/* Paso 3: Trade */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 3
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                : currentStep > 3
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60"
                  : "bg-white/[0.01] border-white/5 text-white/30"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                currentStep === 3
                  ? "bg-purple-400 text-black animate-pulse"
                  : currentStep > 3
                    ? "bg-emerald-400 text-black"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {currentStep > 3 ? "✓" : "3"}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                {t("admin.orders.sendTrade")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 3
                  ? t("admin.orders.activeTrade")
                  : currentStep > 3
                    ? t("admin.orders.tradeAccepted")
                    : t("admin.orders.queued")}
              </span>
            </div>
          </div>

          {/* Paso 4: Completar */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 4
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.01] border-white/5 text-white/30"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                currentStep === 4
                  ? "bg-emerald-400 text-black"
                  : "bg-white/10 text-white/40"
              }`}
            >
              4
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                Completado
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 4 ? t("purchases.step.skinDelivered") : t("admin.orders.queued")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-white/5 pb-5 mb-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-[3px] border border-white/5 bg-white/[0.015] p-4">
          <span className="mb-2 flex items-center gap-1.5 text-[10px] text-[#84849b] font-mono uppercase tracking-wider">
            <Bot className="h-3.5 w-3.5" />
            {t("admin.orders.selectBotAccount") || "Bot de Envio"}
          </span>
          {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
            <AdminSelect
              value={selectedBotId}
              onChange={setSelectedBotId}
              className="w-full"
              options={[
                { value: "", label: t("admin.orders.selectBotPlaceholder") || "Seleccionar bot..." },
                ...bots.filter((b) => b.isActive).map((b) => ({ value: b.id, label: `${b.name} (${b.steamId.slice(-4)})` }))
              ]}
            />
          ) : (
            <span className="block rounded-[3px] border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-bold text-white/80">
              {assignedBotLabel}
            </span>
          )}
          <p className="mt-2 text-[10px] font-semibold leading-relaxed text-white/35">
            {t("admin.orders.purchaseBotHelper")}
          </p>
        </div>

        <div className="rounded-[3px] border border-white/5 bg-white/[0.015] p-4">
          <span className="text-[10px] text-[#84849b] font-mono block mb-1 uppercase tracking-wider">
            {t("admin.orders.manualStatusChange")}
          </span>
          <p className="mb-3 text-[10px] font-semibold text-white/35">
            {t("admin.orders.purchaseStatusHelper")}
          </p>
          <div className="grid grid-cols-2 gap-1.5 xl:flex xl:flex-wrap xl:items-center">
            <button
              onClick={() => handleUpdateStatus(order.id, "PENDING_PAYMENT")}
              className={`w-full sm:w-auto px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "PENDING_PAYMENT"
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              {t("purchases.status.paymentPending")}
            </button>
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "PAID");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.markPaid")}
              className={`w-full sm:w-auto px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "PAID"
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              {t("purchases.status.paid")}
            </button>
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "TRADE_PENDING");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.markTradePending")}
              className={`w-full sm:w-auto px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "TRADE_PENDING"
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              {t("purchases.status.tradePending")}
            </button>
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "COMPLETED");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.orders.completeOrder")}
              className={`w-full sm:w-auto px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "COMPLETED"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              {t("admin.orders.complete")}
            </button>
            <button
              onClick={() => {
                if (canCancel) {
                  handleUpdateStatus(order.id, "CANCELLED");
                }
              }}
              disabled={!canCancel}
              title={
                canCancel
                  ? t("admin.orders.cancelOrder")
                  : t("admin.orders.cancelFromPending")
              }
              className={`w-full sm:w-auto px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "CANCELLED"
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : !canCancel
                    ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>

      <OrderDetailPayoutDetails
        order={order}
        onOpenProofModal={() => setProofOpen(true)}
      />

      <PaymentProofModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        proofUrl={buyerProofUrl}
        proof={buyerProof}
        title={t("admin.orders.buyerProof")}
      />

      {/* 📦 SECCIÓN DE ÍTEMS PERMANENTEMENTE ABIERTA */}
      <div className="space-y-3 border-t border-white/5 pt-5 mt-5">
        <div className="flex items-center justify-between font-sans mb-3 text-[10px] text-[#84849b] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            {t("admin.orders.itemsInOrder", { count: order.items.length })}
          </span>

          {/* AUTOMATION BUTTON: Copia todos los Asset IDs de golpe */}
          <button
            onClick={handleCopyAllAssetIds}
            className={`px-3 py-1 border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 rounded-[3px] ${
              copiedAllAssets
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                : "bg-[#110f1e] border-white/5 text-[#84849b] hover:text-white hover:bg-white/5"
            }`}
            title={t("admin.orders.copySteamIds")}
          >
            {copiedAllAssets ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{t("admin.orders.idsCopied")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{t("admin.orders.copySteamIds")}</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
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
      </div>
      <AlertConfirmModal
        isOpen={alertOpen}
        title={t("admin.orders.alertTitle") || "Atención"}
        message={alertMessage}
        type="warning"
        onConfirm={() => setAlertOpen(false)}
      />
    </div>
  );
}
