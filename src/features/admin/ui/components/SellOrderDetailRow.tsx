"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileText,
  Loader2,
  Upload,
  ArrowRight,
  Layers,
  XCircle,
} from "lucide-react";
import { Order, PaymentProofMetadata } from "../../domain/types";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  rarityColors,
  getItemRarity,
  getItemExterior,
  hashCode,
} from "./utils";

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;

  // Remove Doppler phases
  const phases = [
    " | Phase 1",
    " | Phase 2",
    " | Phase 3",
    " | Phase 4",
    " | Ruby",
    " | Sapphire",
    " | Black Pearl",
    " | Emerald",
  ];
  phases.forEach((p) => {
    name = name.replace(p, "");
  });

  // Remove exteriors
  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
    " | Factory New",
    " | Minimal Wear",
    " | Field-Tested",
    " | Well-Worn",
    " | Battle-Scarred",
    " Factory New",
    " Minimal Wear",
    " Field-Tested",
    " Well-Worn",
    " Battle-Scarred",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });

  // Remove star symbols
  name = name.replace("★ ", "");
  name = name.replace("★", "");

  return name.trim();
}

interface SellOrderDetailRowProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
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

export function SellOrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
}: SellOrderDetailRowProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [localAdminProof, setLocalAdminProof] = useState<PaymentProofMetadata | null>(null);

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

  const handleCopyTradeLink = (tradeLink: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleCopyAssetId = (assetId: string) => {
    navigator.clipboard.writeText(assetId);
    setCopiedAssetId(assetId);
    setTimeout(() => {
      setCopiedAssetId(null);
    }, 1500);
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
          <span className="flex items-center gap-1">
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
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
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
                  onUpdateStatus(order.id, "TRADE_PENDING");
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
                  onUpdateStatus(order.id, "PAID");
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
                  onUpdateStatus(order.id, "COMPLETED");
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
              onClick={() => onUpdateStatus(order.id, "PENDING_PAYMENT")}
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
                  onUpdateStatus(order.id, "CANCELLED");
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

      {/* 💳 SECCIÓN DE DETALLES DE PAGO Y FACTURACIÓN */}
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
              {t("admin.sellOrders.payoutDetail")}
            </h5>
            <div className="space-y-2 bg-[#110f1e]/40 p-3 border border-white/5 min-h-[120px] rounded-[3px]">
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block">
                  {t("admin.sellOrders.transferRoute")}
                </span>
                <span className="font-black text-accent block mt-0.5 uppercase tracking-wide">
                  {order.paymentMethod === "mercado_pago"
                    ? t("paymentMethod.mercado_pago.name")
                    : order.paymentMethod === "paypal"
                      ? "PayPal"
                      : order.paymentMethod === "ethereum"
                        ? "Ethereum (Web3)"
                        : order.paymentMethod === "binance"
                          ? "Binance Pay"
                          : order.paymentMethod || t("common.notSpecified")}
                </span>
              </div>

              {order.paymentMethod === "nowpayments" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.cryptoDestinationWallet")}
                    </span>
                    <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1.5 border border-white/5 mt-0.5 rounded-[3px]">
                      {order.metadata?.walletAddress || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.blockchainNetwork")}
                    </span>
                    <span className="font-bold text-white block mt-0.5">
                      {order.metadata?.network || "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {order.paymentMethod === "mercado_pago" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.destinationBankAccount")}
                    </span>
                    <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1.5 border border-white/5 mt-0.5 rounded-[3px]">
                      {order.metadata?.cbu || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
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
                </div>
              )}

              {order.paymentMethod === "paypal" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.destinationPaypalEmail")}
                    </span>
                    <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1.5 border border-white/5 mt-0.5 rounded-[3px]">
                      {order.metadata?.cbu || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block mt-1">
                      {t("admin.orders.paypalHolder")}
                    </span>
                    <span className="font-bold text-white block">
                      {order.metadata?.accountHolder || "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {(order.paymentMethod === "ethereum" ||
                order.paymentMethod === "binance") && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      {t("admin.orders.destinationWallet")}
                    </span>
                    <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1.5 border border-white/5 mt-0.5 rounded-[3px]">
                      {order.metadata?.walletAddress || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block mt-1">
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
                  {t("admin.sellOrders.noExternalTransferDetails")}
                </p>
              )}
            </div>
          </div>

          {/* Columna 3: Steam Trade Link */}
          <div className="space-y-2.5">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              {t("admin.sellOrders.tradeConsole")}
            </h5>
            <div className="space-y-3 bg-[#110f1e]/40 p-3 border border-white/5 min-h-[120px] flex flex-col justify-between rounded-[3px]">
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block font-semibold">
                  {t("admin.sellOrders.sellerTradeLink")}
                </span>
                <span className="font-mono text-[9.5px] text-white/80 block mt-1 break-all select-all leading-normal">
                  {order.user?.tradeUrl ||
                    t("admin.common.noTradeUrl")}
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
                    onClick={() =>
                      order.user.tradeUrl &&
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
          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono mb-2">
            {t("admin.sellOrders.paymentProofTitle")}
          </h5>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {adminProof ? (
              <button
                type="button"
                onClick={() => setProofOpen(true)}
                className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-[3px] hover:bg-emerald-500/15 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="min-w-0 text-left">
                  <span className="block text-[10px] font-black uppercase tracking-wider">
                    {t("purchases.viewProof")}
                  </span>
                  <span className="block text-[9px] text-emerald-100/70 truncate">
                    {adminProof.fileName || t("purchases.attachedFile")}
                  </span>
                </span>
              </button>
            ) : (
              <p className="text-[10px] text-white/30 font-bold">
                {t("admin.sellOrders.noAdminProof")}
              </p>
            )}

            <label
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-[3px] text-[9.5px] font-black uppercase tracking-wider transition-colors ${
                canUploadAdminProof && !uploadingProof
                  ? "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                  : "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
              }`}
              title={canUploadAdminProof ? t("admin.sellOrders.uploadProof") : t("admin.sellOrders.proofAvailableWhenPaid")}
            >
              {uploadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {adminProof ? t("common.replace") : t("admin.sellOrders.uploadProof")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="sr-only"
                disabled={!canUploadAdminProof || uploadingProof}
                onChange={(event) => {
                  void handleAdminProofUpload(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {proofError && (
            <p className="text-[10px] text-red-300 font-bold mt-2">{proofError}</p>
          )}
        </div>
      </div>

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
          {order.items.map((item) => {
            const resolvedDetails = resolvedItemsMap[item.assetId] || {};
            const finalFloat =
              item.float !== null && item.float !== undefined
                ? item.float
                : resolvedDetails.float !== undefined
                  ? resolvedDetails.float
                  : null;
            const finalPattern =
              item.pattern !== null && item.pattern !== undefined
                ? item.pattern
                : resolvedDetails.pattern !== undefined
                  ? resolvedDetails.pattern
                  : null;
            const finalRarity =
              item.rarity || resolvedDetails.rarity || getItemRarity(item);
            const finalExterior =
              item.exterior ||
              resolvedDetails.exterior ||
              getItemExterior(item);

            const displayFloat = finalFloat;
            const displayPattern = finalPattern;

            const isStatTrak = item.name.includes("StatTrak™") || item.name.includes("StatTrak");
            const isSouvenir = item.name.includes("Souvenir");
            const isStar = item.name.includes("★") || item.name.includes("★");

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-6 bg-[#090812] p-5 border relative overflow-hidden group rounded-[3px] transition-all duration-300 hover:bg-[#0c0a1a] border-white/5 ${rarityColors[finalRarity] || ""}`}
              >
                {/* Visual Accent stripe for physical verified items vs resell items */}
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-500 via-purple-500 to-indigo-500 opacity-60" />

                {/* Icon image */}
                <div className="w-24 h-16 relative bg-[#131124] border border-white/5 p-2 flex items-center justify-center flex-shrink-0 font-sans rounded-[4px] shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                  {item.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      className="w-full h-full object-contain drop-shadow-md"
                      alt={item.name}
                    />
                  ) : (
                    <span className="text-[8px] text-[#84849b] font-mono">
                      No Image
                    </span>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-white block truncate tracking-wide">
                      {item.name}
                    </span>

                    {/* STATTRAK / SOUVENIR SPECIAL BADGES */}
                    {isStatTrak && (
                      <span className="text-[7.5px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(249,115,22,0.1)]">
                        StatTrak™
                      </span>
                    )}
                    {isSouvenir && (
                      <span className="text-[7.5px] font-black uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(234,179,8,0.1)]">
                        Souvenir
                      </span>
                    )}
                    {isStar && (
                      <span className="text-[7.5px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(168,85,247,0.1)]">
                        ★ Especial
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-[#84849b]">
                    <a
                      href={
                        order.user?.steamId
                          ? `https://steamcommunity.com/profiles/${order.user.steamId}/inventory/#730`
                          : `https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded-[2px] font-sans transition-all hover:scale-105 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
                    >
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-0.5 animate-pulse" />
                      <span>{t("admin.orders.clientInventorySale")}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <span className="text-[8.5px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-[2px] font-sans tracking-wide">
                      Recibiendo Skin
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[9.5px] font-mono">
                    {finalExterior && (
                      <span className="text-white font-sans uppercase tracking-wider font-extrabold bg-white/10 px-2 py-0.5 rounded-sm border border-white/5">
                        {finalExterior}
                      </span>
                    )}

                    {finalRarity && (
                      <span className="text-white/90 font-sans uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                        {finalRarity}
                      </span>
                    )}

                    {displayPattern !== null &&
                      displayPattern !== undefined && (
                        <span className="text-white/90 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5 flex items-center gap-1">
                          <span className="text-[#84849b]">{t("admin.orders.seed")}:</span>
                          <span className="font-extrabold text-accent">{displayPattern}</span>
                        </span>
                      )}

                    <button
                      onClick={() => handleCopyAssetId(item.assetId)}
                      className="text-[#84849b] bg-[#141223] hover:bg-white/10 hover:text-white px-2 py-0.5 rounded-sm border border-white/5 font-mono text-[9.5px] flex items-center gap-1 transition-all cursor-pointer rounded-[3px]"
                      title={t("admin.orders.copyAssetId")}
                    >
                      <span>AssetID:</span>
                      <span className="text-white font-semibold select-all">
                        {item.assetId}
                      </span>
                      {copiedAssetId === item.assetId ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-white/35" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Float display */}
                {displayFloat !== null && displayFloat !== undefined ? (
                  <div className="sm:w-48 flex-shrink-0 bg-[#121021]/80 border border-white/5 p-3 rounded-[3px]">
                    <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono">
                      Float Registrado
                    </span>
                    <span className="text-[11px] font-black font-mono text-white block mt-1 select-all">
                      {displayFloat.toFixed(10)}
                    </span>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5 relative">
                      <div
                        className={`h-full rounded-full ${
                          displayFloat < 0.07
                            ? "bg-emerald-400"
                            : displayFloat < 0.15
                              ? "bg-blue-400"
                              : displayFloat < 0.38
                                ? "bg-yellow-400"
                                : displayFloat < 0.45
                                  ? "bg-orange-400"
                                  : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.min(100, displayFloat * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="sm:w-48 flex-shrink-0 bg-[#121021]/80 border border-white/5 p-3 rounded-[3px] flex flex-col justify-center">
                    <span className="text-[9px] uppercase tracking-wider font-black text-white/25 font-mono">
                      Float Registrado
                    </span>
                    <span className="text-[10px] text-white/35 font-mono mt-1 font-bold">
                      N/A (Sujeto a entrega)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">
                    Precio Acordado
                  </span>
                  <div>
                    <span className="text-sm sm:text-base font-black text-accent">
                      ${item.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-[#84849b] font-bold block">
                      USD
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
