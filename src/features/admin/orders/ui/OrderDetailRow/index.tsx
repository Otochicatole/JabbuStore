"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Layers,
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
  const [copied, setCopied] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [updating, setUpdating] = useState(false);
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

  // AUTOMATION: Performs the transition in one click (e.g. Approve Payment & go straight to Trade Pending)
  const handleAutoApproveAndTrade = async () => {
    if (!selectedBotId) {
      setAlertMessage(t("admin.orders.selectBotRequiredError") || "Debes seleccionar una cuenta de bot para poder generar el trade.");
      setAlertOpen(true);
      return;
    }
    setUpdating(true);
    try {
      // 1. Mark as PAID
      await onUpdateStatus(order.id, "PAID", selectedBotId);
      // 2. Mark as TRADE_PENDING
      await onUpdateStatus(order.id, "TRADE_PENDING", selectedBotId);
      // 3. Automatically copy user tradelink to ease the operator's life
      if (order.user?.tradeUrl) {
        navigator.clipboard.writeText(order.user.tradeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Auto-process failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const currentStep = getWorkflowStep();
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "CANCELLED";
  const buyerProof = order.metadata?.buyerPaymentProof;
  const buyerProofUrl = buyerProof ? `${BACKEND_URL}/orders/${order.id}/payment-proof/buyer` : null;

  return (
    <div
      className={`bg-[#0e0d16]/90 border p-4 sm:p-6 transition-all duration-300 relative overflow-hidden rounded-[3px] ${
        order.status === "PENDING_PAYMENT"
          ? "border-white/5 hover:border-orange-500/20"
          : order.status === "PAID"
            ? "border-blue-500/10 hover:border-blue-500/30"
            : order.status === "TRADE_PENDING"
              ? "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.05)]"
              : "border-emerald-500/10 hover:border-emerald-500/30"
      }`}
    >
      {/* 🚀 BARRA DE WORKFLOW VISUAL (UI/UX PREMIUM) */}
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

      {/* Cabecera de Datos Generales y Cambio de Estado Manual */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          {order.user?.avatar && (
            <img
              src={order.user.avatar}
              className="w-10 h-10 border border-white/10 rounded-[3px] shrink-0"
              alt="avatar"
            />
          )}
          <div className="min-w-0">
            <span className="text-[10px] text-[#84849b] font-mono block">
              {t("admin.orders.buyer")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-white text-sm truncate max-w-[150px]">
                {order.user?.name || t("admin.common.unknownUser")}
              </span>
              <span className="text-[9.5px] text-accent font-mono break-all">
                ({order.user?.steamId})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1 border-t border-b border-white/[0.02] py-2 lg:py-0 lg:border-none">
          <span className="text-[10px] text-[#84849b] font-mono">
            {t("admin.orders.totalAmount")}
          </span>
          <span className="text-emerald-400 font-black text-xl leading-none block">
            ${order.totalPrice.toLocaleString()} USD
          </span>
        </div>

        <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1">
          <span className="text-[10px] text-[#84849b] font-mono">
            {t("common.status")}
          </span>
          <span
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-black uppercase tracking-widest block ${
              order.status === "PENDING_PAYMENT"
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : order.status === "PAID"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : order.status === "TRADE_PENDING"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : order.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {order.status === "PENDING_PAYMENT"
              ? t("purchases.status.paymentPending")
              : order.status === "PAID"
                ? t("purchases.status.paid")
                : order.status === "TRADE_PENDING"
                  ? t("purchases.status.tradePending")
                  : order.status === "COMPLETED"
                    ? t("purchases.status.completed")
                    : t("purchases.status.cancelled")}
          </span>
        </div>

        {/* Bot selector column */}
        {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
          <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1.5 w-full lg:w-44 shrink-0">
            <span className="text-[10px] text-[#84849b] font-mono uppercase tracking-wider block">
              {t("admin.orders.selectBotAccount") || "Bot de Envío"}
            </span>
            <AdminSelect
              value={selectedBotId}
              onChange={setSelectedBotId}
              className="w-full sm:w-full min-w-full"
              options={[
                { value: "", label: t("admin.orders.selectBotPlaceholder") || "Seleccionar bot..." },
                ...bots.filter(b => b.isActive).map(b => ({ value: b.id, label: `${b.name} (${b.steamId.slice(-4)})` }))
              ]}
            />
          </div>
        ) : (
          <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1">
            <span className="text-[10px] text-[#84849b] font-mono">
              {t("admin.orders.selectedBot") || "Bot Asignado"}
            </span>
            <span className="text-xs text-white/80 font-mono font-bold block bg-white/5 px-2.5 py-1.5 rounded-[3px] border border-white/10 font-mono">
              {order.bot ? `${order.bot.name} (${order.bot.steamId.slice(-4)})` : "Ninguno"}
            </span>
          </div>
        )}

        {/* 🛠️ MANUAL STATUS BUTTONS (CAMBIO DE ESTADO MANUAL CLÁSICO) */}
        <div className="space-y-1.5 w-full lg:w-auto">
          <span className="text-[10px] text-[#84849b] font-mono block mb-1 uppercase tracking-wider">
            {t("admin.orders.manualStatusChange")}
          </span>
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
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

      {/* 💳 SECCIÓN DE DETALLES DE PAGO Y FACTURACIÓN */}
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
