"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Layers,
  XCircle,
} from "lucide-react";
import { Order, PaymentProofMetadata } from "../../../domain/types";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { PayoutDetailsPanel } from "./PayoutDetailsPanel";
import { SellOrderDetailItem } from "./SellOrderDetailItem";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

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
  bots?: any[];
}

export function SellOrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
  bots = [],
}: SellOrderDetailRowProps) {
  const { t } = useI18n();
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [localAdminProof, setLocalAdminProof] = useState<PaymentProofMetadata | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string>(order.botId || "");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Workflow steps based on order status for SELL orders
  // 1. PENDING_PAYMENT (Pendiente de Aprobación)
  // 2. TRADE_PENDING (Venta Aprobada, Esperando Trade de la Skin)
  // 3. PAID (Trade Confirmado / Pendiente de Pago al Usuario)
  // 4. COMPLETED (Pago Realizado / Completado)
  const getWorkflowStep = (): number => {
    switch (order.status) {
      case "PENDING_PAYMENT":
        return 1;
      case "TRADE_PENDING":
        return 2;
      case "PAID":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 0;
    }
  };

  const handleCopyAllAssetIds = () => {
    const assetIds = order.items.map((item) => item.assetId).join(", ");
    navigator.clipboard.writeText(assetIds);
    setCopiedAllAssets(true);
    setTimeout(() => {
      setCopiedAllAssets(false);
    }, 2000);
  };

  const currentStep = getWorkflowStep();
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "CANCELLED";
  const adminProof = localAdminProof || order.metadata?.adminPaymentProof || null;
  const adminProofUrl = adminProof ? `${BACKEND_URL}/orders/${order.id}/payment-proof/admin` : null;
  const canUploadAdminProof = order.status === "PAID" || order.status === "COMPLETED";

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
      setAlertMessage(t("admin.orders.selectBotRequiredError") || "Debes seleccionar una cuenta de bot para poder cambiar el estado.");
      setAlertOpen(true);
      return;
    }
    await onUpdateStatus(orderId, newStatus, selectedBotId || null);
  };

  return (
    <div
      className={`bg-[#0e0d16]/95 border p-4 sm:p-6 transition-all duration-300 relative overflow-hidden rounded-[3px] ${
        order.status === "PENDING_PAYMENT"
          ? "border-white/5 hover:border-orange-500/20"
          : order.status === "TRADE_PENDING"
            ? "border-blue-500/10 hover:border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.05)]"
            : order.status === "PAID"
              ? "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.05)]"
              : "border-emerald-500/10 hover:border-emerald-500/30"
      }`}
    >
      {/* 🚀 BARRA DE WORKFLOW VISUAL DE VENTA */}
      <div className="mb-6 bg-white/[0.01] border border-white/5 p-4 rounded-[3px]">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider font-mono text-[#84849b] mb-4">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-accent" />
            {t("admin.sellOrders.operationFlow")}
          </span>
          <span className="text-white/40 font-mono">{t("purchases.order")} ID: {order.id}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Paso 1: Aprobación */}
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
                {t("admin.sellOrders.approveSale")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 1 ? t("purchases.step.pending") : t("admin.sellOrders.approved")}
              </span>
            </div>
          </div>

          {/* Paso 2: Trade */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 2
                ? "bg-blue-500/5 border-blue-500/20 text-blue-400 animate-pulse"
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
                {t("admin.sellOrders.receiveTrade")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 2
                  ? t("admin.sellOrders.waitingItem")
                  : currentStep > 2
                    ? t("admin.sellOrders.itemInBot")
                    : t("admin.orders.queued")}
              </span>
            </div>
          </div>

          {/* Paso 3: Pago */}
          <div
            className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
              currentStep === 3
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                : currentStep > 3
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60"
                  : "bg-white/[0.01] border-white/5 text-white/30"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                currentStep === 3
                  ? "bg-purple-400 text-black"
                  : currentStep > 3
                    ? "bg-emerald-400 text-black"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {currentStep > 3 ? "✓" : "3"}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                {t("admin.sellOrders.payUser")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 3
                  ? t("admin.sellOrders.toTransfer")
                  : currentStep > 3
                    ? t("admin.sellOrders.paymentSent")
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
                currentStep === 4 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/40"
              }`}
            >
              4
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block leading-tight">
                {t("admin.sellOrders.completed")}
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 4 ? t("admin.sellOrders.ready") : t("purchases.step.pending")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabecera de Datos Generales y Acción Paso a Paso */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {order.user?.avatar && (
            <img
              src={order.user.avatar}
              className="w-10 h-10 border border-white/10 rounded-[3px] shrink-0"
              alt="avatar"
            />
          )}
          <div className="min-w-0">
            <span className="text-[10px] text-[#84849b] font-mono block">
              {t("admin.sellOrders.seller")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-white text-sm truncate max-w-[150px]">
                {order.user?.name || t("admin.common.unknownUser")}
              </span>
              <span className="text-[9.5px] text-accent font-mono truncate">
                ({order.user?.steamId})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1 border-t border-b border-white/[0.02] py-2 lg:py-0 lg:border-none">
          <span className="text-[10px] text-[#84849b] font-mono">
            {t("admin.sellOrders.amountToPay")}
          </span>
          <span className="text-emerald-400 font-black text-xl leading-none block">
            ${order.totalPrice.toLocaleString()} USD
          </span>
        </div>

        <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1">
          <span className="text-[10px] text-[#84849b] font-mono">
            {t("admin.sellOrders.currentStatus")}
          </span>
          <span
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-black uppercase tracking-widest block ${
              order.status === "PENDING_PAYMENT"
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : order.status === "TRADE_PENDING"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : order.status === "PAID"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : order.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {order.status === "PENDING_PAYMENT"
              ? t("purchases.status.sellPendingApproval")
              : order.status === "TRADE_PENDING"
                ? t("purchases.status.sellApprovedSendTrade")
                : order.status === "PAID"
                  ? t("purchases.status.tradeConfirmedPendingPayment")
                  : order.status === "COMPLETED"
                    ? t("purchases.status.sellCompletedPaid")
                    : t("purchases.status.sellRejected")}
          </span>
        </div>

        {/* Bot selector column */}
        {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
          <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-1.5 w-full lg:w-44 shrink-0">
            <span className="text-[10px] text-[#84849b] font-mono uppercase tracking-wider block">
              {t("admin.orders.selectBotAccount") || "Bot de Recibo"}
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

        {/* 🛠️ MANUAL / PASO A PASO ACTION BUTTONS */}
        <div className="space-y-1.5 w-full lg:w-auto">
          <span className="text-[10px] text-[#84849b] font-mono block mb-1 uppercase tracking-wider">
            {t("admin.sellOrders.correctFlowAction")}
          </span>
          <div className="grid grid-cols-1 gap-1.5 bg-white/[0.01] border border-white/5 p-3 rounded-[3px] sm:flex sm:flex-wrap sm:items-center">
            {/* Paso 1: Aprobar Venta */}
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "TRADE_PENDING");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.approveSaleTitle")}
              className={`w-full justify-center sm:w-auto px-3 py-2 border text-[9.5px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer flex items-center gap-1.5 ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "TRADE_PENDING"
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400 font-extrabold shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("admin.sellOrders.approveSale")}
            </button>
 
            {/* Paso 2: Confirmar Trade Recibido */}
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "PAID");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.confirmTradeReceived")}
              className={`w-full justify-center sm:w-auto px-3 py-2 border text-[9.5px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer flex items-center gap-1.5 ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "PAID"
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400 font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {t("admin.sellOrders.tradeReceivedStep")}
            </button>
 
            {/* Paso 3: Pago al Usuario / Completar */}
            <button
              onClick={() => {
                if (!isCancelled) {
                  handleUpdateStatus(order.id, "COMPLETED");
                }
              }}
              disabled={isCancelled}
              title={isCancelled ? t("admin.common.backToPendingFromCancelled") : t("admin.sellOrders.completeSale")}
              className={`w-full justify-center sm:w-auto px-3 py-2 border text-[9.5px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer flex items-center gap-1.5 ${
                isCancelled
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : order.status === "COMPLETED"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {t("admin.sellOrders.paymentSentStep")}
            </button>
 
            {/* Volver a Pendiente por si dio mal click */}
            <button
              onClick={() => handleUpdateStatus(order.id, "PENDING_PAYMENT")}
              className={`w-full sm:w-auto px-3 py-2 border text-[9.5px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "PENDING_PAYMENT"
                  ? "bg-[#110f1e] border-[#84849b]/40 text-[#84849b]"
                  : "bg-white/5 border-white/5 text-white/30 hover:text-white"
              }`}
              title={t("admin.sellOrders.resetToPending")}
            >
              {t("admin.sellOrders.resetToPending")}
            </button>
 
            {/* Rechazar/Cancelar */}
            <button
              onClick={() => {
                if (canCancel) {
                  handleUpdateStatus(order.id, "CANCELLED");
                }
              }}
              disabled={!canCancel}
              title={
                canCancel
                  ? t("admin.sellOrders.cancelSale")
                  : t("admin.sellOrders.cancelFromPending")
              }
              className={`w-full justify-center sm:w-auto px-3 py-2 border text-[9.5px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer flex items-center gap-1.5 ${
                order.status === "CANCELLED"
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : !canCancel
                    ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed opacity-50"
                    : "bg-white/5 border-white/5 text-red-500/40 hover:text-red-400 hover:bg-red-500/5"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("admin.sellOrders.rejectCancel")}
            </button>
          </div>
        </div>
      </div>

      <PayoutDetailsPanel
        order={order}
        adminProof={adminProof}
        adminProofUrl={adminProofUrl}
        canUploadAdminProof={canUploadAdminProof}
        uploadingProof={uploadingProof}
        proofError={proofError}
        onUploadAdminProof={handleAdminProofUpload}
        onOpenProofModal={() => setProofOpen(true)}
      />

      <PaymentProofModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        proofUrl={adminProofUrl}
        proof={adminProof}
        title={t("admin.sellOrders.userPaymentProof")}
      />

      {/* 📦 SECCIÓN DE ÍTEMS A RECIBIR */}
      <div className="space-y-3 border-t border-white/5 pt-5 mt-5">
        <div className="flex items-center justify-between font-sans mb-3 text-[10px] text-[#84849b] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            {t("admin.sellOrders.itemsToReceive", { count: order.items.length })}
          </span>

          {/* AUTOMATION BUTTON: Copia todos los Asset IDs de golpe */}
          <button
            onClick={handleCopyAllAssetIds}
            className={`px-3 py-1 border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 rounded-[3px] ${
              copiedAllAssets
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                : "bg-[#110f1e] border-white/5 text-[#84849b] hover:text-white hover:bg-white/5"
            }`}
            title={t("admin.sellOrders.copySellerSkinIds")}
          >
            {copiedAllAssets ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{t("admin.orders.idsCopied")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t("admin.sellOrders.copySellerSkinIds")}</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <SellOrderDetailItem
              key={item.id}
              item={item}
              resolvedDetails={resolvedItemsMap[item.assetId] || {}}
              sellerSteamId={order.user?.steamId || undefined}
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
