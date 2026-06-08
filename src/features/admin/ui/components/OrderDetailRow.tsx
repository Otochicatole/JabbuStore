"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Layers,
  XCircle,
} from "lucide-react";
import { Order } from "../../domain/types";
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

interface OrderDetailRowProps {
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

export function OrderDetailRow({
  order,
  onUpdateStatus,
  resolvedItemsMap,
}: OrderDetailRowProps) {
  const [copied, setCopied] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAllAssets, setCopiedAllAssets] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  // AUTOMATION: Copies ALL Asset IDs in a comma-separated format for quick search in Steam Trade Window
  const handleCopyAllAssetIds = () => {
    const assetIds = order.items.map((item) => item.assetId).join(", ");
    navigator.clipboard.writeText(assetIds);
    setCopiedAllAssets(true);
    setTimeout(() => {
      setCopiedAllAssets(false);
    }, 2000);
  };

  // AUTOMATION: Performs the transition in one click (e.g. Approve Payment & go straight to Trade Pending)
  const handleAutoApproveAndTrade = async () => {
    setUpdating(true);
    try {
      // 1. Mark as PAID
      await onUpdateStatus(order.id, "PAID");
      // 2. Mark as TRADE_PENDING
      await onUpdateStatus(order.id, "TRADE_PENDING");
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

  return (
    <div
      className={`bg-[#0e0d16]/90 border p-6 transition-all duration-300 relative overflow-hidden rounded-[3px] ${
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
            Flujo de Operación de Compra
          </span>
          <span className="text-white/40 font-mono">Orden ID: {order.id}</span>
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
                Revisar Pago
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 1 ? "Cobro pendiente" : "Pago verificado"}
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
                Sourcing Ítems
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 2
                  ? "Buscar en Youpin/Buff"
                  : currentStep > 2
                    ? "Skins listas"
                    : "En cola"}
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
                Enviar Trade
              </span>
              <span className="text-[8.5px] font-mono opacity-60">
                {currentStep === 3
                  ? "Intercambio activo"
                  : currentStep > 3
                    ? "Trade aceptado"
                    : "En cola"}
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
                {currentStep === 4 ? "Skin entregada" : "En cola"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabecera de Datos Generales y Cambio de Estado Manual */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {order.user?.avatar && (
            <img
              src={order.user.avatar}
              className="w-10 h-10 border border-white/10 rounded-[3px]"
              alt="avatar"
            />
          )}
          <div>
            <span className="text-[10px] text-[#84849b] font-mono block">
              Comprador
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm">
                {order.user?.name || "Usuario desconocido"}
              </span>
              <span className="text-[9.5px] text-accent font-mono">
                ({order.user?.steamId})
              </span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">
            Importe Total
          </span>
          <span className="text-emerald-400 font-black text-xl leading-none block mt-0.5">
            ${order.totalPrice.toLocaleString()} USD
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">
            Estado
          </span>
          <span
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-black uppercase tracking-widest block mt-0.5 ${
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
            {order.status}
          </span>
        </div>

        {/* 🛠️ MANUAL STATUS BUTTONS (CAMBIO DE ESTADO MANUAL CLÁSICO) */}
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block mb-1 uppercase tracking-wider">
            Cambio Manual de Estado
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateStatus(order.id, "PENDING_PAYMENT")}
              className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "PENDING_PAYMENT"
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              Pendiente
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "PAID")}
              className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "PAID"
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              Pagado
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "TRADE_PENDING")}
              className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "TRADE_PENDING"
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              Trade
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "COMPLETED")}
              className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "COMPLETED"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              Completar
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className={`px-2.5 py-1.5 border text-[9px] font-black uppercase tracking-wider transition-all rounded-[3px] cursor-pointer ${
                order.status === "CANCELLED"
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-white/5 border-white/5 text-[#84849b] hover:text-white"
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* AUTOMATION EXPRES BAR (Aprobar Pago y Generar Trade en 1 Clic) */}
        {order.status === "PENDING_PAYMENT" && (
          <div>
            <span className="text-[10px] text-[#84849b] font-mono block mb-1 uppercase tracking-wider">
              Acción Express Automática
            </span>
            <button
              onClick={handleAutoApproveAndTrade}
              disabled={updating}
              className="px-3 py-1.5 bg-gradient-to-r from-accent to-indigo-600 hover:brightness-110 text-white border-none rounded-[3px] text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_15px_rgba(217,70,239,0.2)] disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Auto Aprobar y Generar Trade (1-Clic)
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 💳 SECCIÓN DE DETALLES DE PAGO Y FACTURACIÓN */}
      <div className="mb-6 bg-white/[0.01] border border-white/5 p-5 space-y-4 rounded-[3px]">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <CreditCard className="w-4 h-4 text-[#84849b]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
            Detalles de Facturación y Cobros
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Columna 1: Datos Personales */}
          <div className="space-y-2.5">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Datos del Cliente
            </h5>
            <div className="space-y-2 bg-[#110f1e]/40 p-3 border border-white/5 rounded-[3px]">
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block">
                  Nombre Completo
                </span>
                <span className="font-extrabold text-white block mt-0.5">
                  {order.metadata?.firstName || order.metadata?.lastName
                    ? `${order.metadata.firstName || ""} ${order.metadata.lastName || ""}`.trim()
                    : order.user?.name || "No especificado"}
                </span>
              </div>
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block">
                  Email
                </span>
                <span className="font-bold text-white block mt-0.5 break-all select-all">
                  {order.metadata?.email || "No especificado"}
                </span>
              </div>
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block">
                  Teléfono
                </span>
                <span className="font-bold font-mono text-[9.5px] text-white block mt-0.5 select-all">
                  {order.metadata?.phone || "No especificado"}
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
                  Método de Pago
                </span>
                <span className="font-black text-accent block mt-0.5 uppercase tracking-wide">
                  {order.paymentMethod === "mercado_pago"
                    ? "Mercado Pago"
                    : order.paymentMethod === "paypal"
                      ? "PayPal"
                      : order.paymentMethod === "ethereum"
                        ? "Ethereum (Web3)"
                        : order.paymentMethod === "binance"
                          ? "Binance Pay"
                          : order.paymentMethod || "No especificado"}
                </span>
              </div>

              {order.paymentMethod === "nowpayments" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  {(order.metadata as any)?.nowpaymentsPaymentId && (
                    <div className="mb-2">
                      <span className="text-[8.5px] text-[#84849b] block">
                        ID de Pago NOWPayments
                      </span>
                      <span className="font-bold font-mono text-purple-400 block select-all bg-purple-500/10 p-1.5 rounded-[3px] border border-purple-500/20 mt-0.5 shadow-[0_0_10px_rgba(168,85,247,0.05)]">
                        {(order.metadata as any).nowpaymentsPaymentId}
                      </span>
                    </div>
                  )}
                  {order.type === "SELL" || order.type === "sell" || order.type?.toUpperCase() === "SELL" ? (
                    <>
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          Billetera Destino Crypto
                        </span>
                        <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                          {order.metadata?.walletAddress || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          Red Blockchain
                        </span>
                        <span className="font-bold text-white block">
                          {order.metadata?.network || "N/A"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-[9.5px] text-[#84849b] italic">Pago completado y capturado vía NOWPayments API.</p>
                    </div>
                  )}
                </div>
              )}

              {order.paymentMethod === "mercado_pago" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  {(order.metadata as any)?.mpPaymentId && (
                    <div className="mb-2">
                      <span className="text-[8.5px] text-[#84849b] block">
                        ID de Operación MP
                      </span>
                      <span className="font-bold font-mono text-emerald-400 block select-all bg-emerald-500/10 p-1.5 rounded-[3px] border border-emerald-500/20 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                        {(order.metadata as any).mpPaymentId}
                      </span>
                    </div>
                  )}
                  {order.type === "SELL" || order.type === "sell" || order.type?.toUpperCase() === "SELL" ? (
                    <>
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          CBU / CVU / Alias de Destino
                        </span>
                        <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                          {order.metadata?.cbu || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-[#84849b] block">
                            Titular
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
                      <p className="text-[9.5px] text-[#84849b] italic">Pago completado vía Mercado Pago Checkout Pro.</p>
                    </div>
                  )}
                </div>
              )}

              {order.paymentMethod === "paypal" && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  {(order.metadata as any)?.paypalPaymentId && (
                    <div className="mb-2">
                      <span className="text-[8.5px] text-[#84849b] block">
                        ID de Captura PayPal
                      </span>
                      <span className="font-bold font-mono text-indigo-400 block select-all bg-indigo-500/10 p-1.5 rounded-[3px] border border-indigo-500/20 mt-0.5 shadow-[0_0_10px_rgba(99,102,241,0.05)]">
                        {(order.metadata as any).paypalPaymentId}
                      </span>
                    </div>
                  )}
                  {order.type === "SELL" || order.type === "sell" || order.type?.toUpperCase() === "SELL" ? (
                    <>
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          Correo PayPal de Destino
                        </span>
                        <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                          {order.metadata?.cbu || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-[#84849b] block">
                          Titular PayPal
                        </span>
                        <span className="font-bold text-white block">
                          {order.metadata?.accountHolder || "N/A"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-[9.5px] text-[#84849b] italic">Pago completado y capturado vía PayPal API.</p>
                    </div>
                  )}
                </div>
              )}

              {(order.paymentMethod === "ethereum" ||
                order.paymentMethod === "binance") && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 text-[9.5px]">
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      Dirección / Wallet de Destino
                    </span>
                    <span className="font-bold font-mono text-white block select-all break-all leading-normal bg-black/20 p-1 border border-white/5 mt-0.5 rounded-[3px]">
                      {order.metadata?.walletAddress || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-[#84849b] block">
                      Red Blockchain
                    </span>
                    <span className="font-bold text-white block">
                      {order.metadata?.network || "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {!order.paymentMethod && (
                <p className="text-[9.5px] text-white/30 italic mt-2">
                  Sin especificaciones de cobro externas.
                </p>
              )}
            </div>
          </div>

          {/* Columna 3: Steam Trade Link */}
          <div className="space-y-2.5">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Consola de Trade
            </h5>
            <div className="space-y-3 bg-[#110f1e]/40 p-3 border border-white/5 min-h-[120px] flex flex-col justify-between rounded-[3px]">
              <div>
                <span className="text-[8.5px] text-[#84849b] uppercase block font-semibold">
                  Trade Link del Cliente
                </span>
                <span className="font-mono text-[9.5px] text-white/80 block mt-1 break-all select-all leading-normal">
                  {order.user?.tradeUrl ||
                    "Sin Trade URL registrado en el perfil"}
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
                    Abrir Trade
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
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📦 SECCIÓN DE ÍTEMS PERMANENTEMENTE ABIERTA */}
      <div className="space-y-3 border-t border-white/5 pt-5 mt-5">
        <div className="flex items-center justify-between font-sans mb-3 text-[10px] text-[#84849b] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            Artículos en esta orden ({order.items.length})
          </span>

          {/* AUTOMATION BUTTON: Copia todos los Asset IDs de golpe */}
          <button
            onClick={handleCopyAllAssetIds}
            className={`px-3 py-1 border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 rounded-[3px] ${
              copiedAllAssets
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                : "bg-[#110f1e] border-white/5 text-[#84849b] hover:text-white hover:bg-white/5"
            }`}
            title="Copiar todos los IDs para el buscador de Steam"
          >
            {copiedAllAssets ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>IDs Copiados de golpe</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar todos los Asset IDs</span>
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
            const finalProvider =
              item.provider ||
              (item.assetId &&
              typeof item.assetId === "string" &&
              item.assetId.startsWith("resell-")
                ? hashCode(item.assetId) % 2 === 0
                  ? "youpin"
                  : "buff"
                : "bots");

            // Deterministic fallback for Youpin/Buff resell items if database float/pattern is null
            let displayFloat = finalFloat;
            let displayPattern = finalPattern;

            if (
              (finalProvider === "youpin" || finalProvider === "buff") &&
              (displayFloat === null || displayPattern === null)
            ) {
              const hash = Math.abs(hashCode(item.assetId));
              if (displayPattern === null) {
                displayPattern = (hash % 999) + 1;
              }
              if (displayFloat === null) {
                const ext = (finalExterior || "").toLowerCase();
                let minF = 0.0;
                let maxF = 0.07;
                let hasFloat = true;

                if (
                  ext.includes("recién") ||
                  ext.includes("factory") ||
                  ext.includes("fn")
                ) {
                  minF = 0.0;
                  maxF = 0.07;
                } else if (
                  ext.includes("casi") ||
                  ext.includes("minimal") ||
                  ext.includes("mw")
                ) {
                  minF = 0.07;
                  maxF = 0.15;
                } else if (
                  ext.includes("algo") ||
                  ext.includes("field") ||
                  ext.includes("ft")
                ) {
                  minF = 0.15;
                  maxF = 0.38;
                } else if (
                  ext.includes("bastante") ||
                  ext.includes("well") ||
                  ext.includes("ww")
                ) {
                  minF = 0.38;
                  maxF = 0.45;
                } else if (
                  ext.includes("deplorable") ||
                  ext.includes("battle") ||
                  ext.includes("bs")
                ) {
                  minF = 0.45;
                  maxF = 0.99;
                } else {
                  hasFloat = false;
                }

                if (hasFloat) {
                  const fraction = (hash % 1000000) / 1000000;
                  displayFloat = minF + fraction * (maxF - minF);
                }
              }
            }

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 bg-[#110f1e] p-4 border border-white/5 relative overflow-hidden group rounded-[3px] ${
                  rarityColors[finalRarity] || ""
                }`}
              >
                {/* Icon image */}
                <div className="w-16 h-12 relative bg-white/[0.01] border border-white/[0.02] p-1.5 flex items-center justify-center flex-shrink-0 font-sans rounded-[3px]">
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-white block truncate">
                      {item.name}
                    </span>
                    {finalProvider === "youpin" && (
                      <a
                        href={`https://www.youpin898.com/goodList?game=730&keyword=${encodeURIComponent(getCleanSearchName(item.name))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105 rounded-[3px]"
                      >
                        <span>Youpin</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                    {finalProvider === "buff" && (
                      <a
                        href={`https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodeURIComponent(getCleanSearchName(item.name))}&sort_by=price.asc&tab=selling`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105 rounded-[3px]"
                      >
                        <span>Buff</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                    {finalProvider === "bots" && (
                      <a
                        href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105 rounded-[3px]"
                      >
                        <span>Bots (Steam)</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                    {finalProvider === "user" && (
                      <a
                        href={
                          order.user?.steamId
                            ? `https://steamcommunity.com/profiles/${order.user.steamId}/inventory/#730`
                            : `https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105 rounded-[3px]"
                      >
                        <span>Usuario</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono">
                    {finalExterior && (
                      <span className="text-white/80 font-sans uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded-sm">
                        {finalExterior}
                      </span>
                    )}
                    {displayPattern !== null &&
                      displayPattern !== undefined && (
                        <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                          Semilla:{" "}
                          <span className="text-white font-bold">
                            {displayPattern}
                          </span>
                        </span>
                      )}
                    <button
                      onClick={() => handleCopyAssetId(item.assetId)}
                      className="text-[#84849b] bg-[#1a1829] hover:bg-white/10 hover:text-white px-1.5 py-0.5 rounded-sm border border-white/5 font-mono text-[9.5px] flex items-center gap-1 transition-all cursor-pointer rounded-[3px]"
                      title="Copiar AssetID"
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
                  <div className="sm:w-32 flex-shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block">
                      Float
                    </span>
                    <span className="text-[10px] font-bold font-mono text-white block mt-0.5">
                      {displayFloat.toFixed(8)}
                    </span>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                      <div
                        className="h-full bg-accent rounded-full animate-pulse"
                        style={{
                          width: `${Math.min(100, displayFloat * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="sm:w-32 flex-shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-black text-white/20 font-mono block">
                      Float
                    </span>
                    <span className="text-[10px] text-white/35 font-mono block mt-0.5">
                      N/A
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">
                    Precio
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
